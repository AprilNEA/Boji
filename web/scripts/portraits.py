"""Cut out portraits, convert to high-contrast B&W, and composite on pure black (4:5)."""
import sys
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
from rembg import remove, new_session

W, H = 1000, 1250
session = new_session("u2net_human_seg")


def process(src: str, dst: str, head_top: float = 0.12, width_ratio: float = 1.0, x_shift: float = 0.0):
    img = Image.open(src).convert("RGB")
    if img.width < 900:
        scale = 900 / img.width
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    cut = remove(img, session=session, alpha_matting=True,
                 alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=10,
                 alpha_matting_erode_size=8)
    alpha = cut.split()[-1].filter(ImageFilter.GaussianBlur(1.2))
    bbox = alpha.point(lambda a: 255 if a > 40 else 0).getbbox()
    if not bbox:
        raise SystemExit(f"no subject found in {src}")

    gray = ImageOps.grayscale(cut.convert("RGB"))
    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = ImageEnhance.Contrast(gray).enhance(1.18)
    gray = ImageEnhance.Brightness(gray).enhance(0.96)
    subject = Image.merge("RGBA", (gray, gray, gray, alpha)).crop(bbox)

    target_w = int(W * width_ratio)
    s = target_w / subject.width
    subject = subject.resize((target_w, int(subject.height * s)), Image.LANCZOS)

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    x = (W - subject.width) // 2 + int(W * x_shift)
    y = int(H * head_top)
    canvas.alpha_composite(subject, (x, y))

    # Bottom fade to black so the torso dissolves into the stage.
    fade = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(fade)
    start = int(H * 0.62)
    for yy in range(start, H):
        t = (yy - start) / (H - start)
        draw.line([(0, yy), (W, yy)], fill=int(255 * min(1, t ** 1.4)))
    black = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    canvas = Image.composite(black, canvas, fade)

    canvas.convert("RGB").save(dst, "WEBP", quality=90, method=6)
    print("saved", dst, subject.size)


if __name__ == "__main__":
    base = "/home/ubuntu/upload/search_images/"
    out = "/home/ubuntu/bojiclub/public/images/portraits/"
    which = sys.argv[1:] or ["alan", "sun"]
    if "alan" in which:
        process(base + "8A34NQFkCqGK.jpg", out + "alan.webp", head_top=0.03, width_ratio=1.32, x_shift=-0.13)
    if "sun" in which:
        process(base + "pohUC3RkS01d.jpg", out + "sun.webp", head_top=0.12, width_ratio=0.94, x_shift=-0.02)
