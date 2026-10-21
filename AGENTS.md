# Boji

Boji is a local-first fitness tracking app. This repository holds two native clients, iOS and Android, a Rust backend, the exercise animations that both clients use, and the 薄肌俱乐部 promotional website. Each directory builds on its own.

## Directory map

| Path | Content | Guide |
| --- | --- | --- |
| `ios/` | iOS app, watchOS app and widgets: SwiftUI and an XcodeGen project | `ios/AGENTS.md` |
| `android/` | Android app: Kotlin, Jetpack Compose and a Gradle project | `android/AGENTS.md` |
| `animations/` | Exercise Lottie animations: a TypeScript generator and the generated JSON | `animations/AGENTS.md` |
| `bizserver/` | Rust backend migration: Axum, better-auth-rs, ConnectRPC, SeaORM and PostgreSQL | `bizserver/AGENTS.md` |
| `websites/` | 薄肌俱乐部 promotional website and the Fumadocs docs site under `/docs`: Next.js static export, Tailwind CSS and Motion | `websites/AGENTS.md` |
| `locales/` | Copy that more than one client shows: ICU MessageFormat in YAML, one directory per language | `locales/README.md` |
| `crates/` | Rust tools for the repository, in their own Cargo workspace. `crates/locales/` generates the client string resources from `locales/` | `crates/AGENTS.md` |
| `docs/` | Documents shared by both clients. `docs/DEVELOPMENT.md` is the developer guide: the repository layout, the toolchain and how to run each component. The root `README.md` links to it and does not repeat it. `docs/membership.md` is the membership contract. `docs/ACCESSIBILITY.md` is the accessibility statement. `docs/sentry.md` describes Sentry error reporting in every project. The `.mdx` pages and `meta.json` files of `docs/` are the docs section that `websites/` publishes under `/docs/`. `docs/sites/` holds the standalone pages that `websites/` publishes: the support page, and the privacy policy, terms of use and third-party data sharing list, with English versions in `.en.mdx` files. The `.md` files of `docs/` are internal and are not published | this file, `docs/sites/AGENTS.md` |
| `assets/public/` | Generic static files for `https://assets.leanmuscle.club`, such as the app icon images, the app screenshots and the exercise images that the root `README.md` shows | this file |
| `LICENSE.md` | The PolyForm Noncommercial License 1.0.0 with the `Required Notice:` line | this file |
| `.github/` | GitHub files: `.github/CLA.md` is the contributor license agreement, `.github/workflows/cla.yml` runs the CLA check on pull requests, and `.github/workflows/image.yml` publishes the `bizserver/` image to GHCR for each `bizserver/v*` tag. `.github/actionlint.yaml` declares runner labels that actionlint does not list yet, such as the GitHub-hosted `xcode-27` preview label. `workflows/ios.yml` runs iOS CI, manual TestFlight uploads and manual App Store review; see `ios/docs/ci-cd.md`. `.github/SECURITY.md` is the security policy: report vulnerabilities to `security@leanmuscle.club`. `.github/CODE_OF_CONDUCT.md` is the Contributor Covenant 3.0 code of conduct in English and Simplified Chinese: report violations to `conduct@leanmuscle.club`. | this file, `bizserver/AGENTS.md` |
| `devenv.nix`, `devenv.yaml`, `.envrc` | Local toolchains: Node.js and pnpm for `animations/` and `websites/`, Rust, `buf` and OpenSSL for `bizserver/`, JDK 17 for `android/`, and Python with Pillow and rembg for `websites/scripts/` | this file |
| `.work/` | Local build outputs and scratch files. Git ignores this directory | none |

## Guides

Read this file first. Then read the `AGENTS.md` that is closest to the file you edit. If two guides conflict, the closer guide takes precedence.

When you change the structure, the commands or the rules of a directory, update the `AGENTS.md` of that directory in the same change. When you add or remove a top-level directory, update the directory map in this file.

Keep the repository root small. Put a new repository-level file in `.github/`, `.config/` or `docs/`, not in the root. Keep a file in the root only when a tool requires it there. `LICENSE.md` stays in the root, because GitHub detects the license there.

## Toolchain

Enter the devenv shell at the repository root with `devenv shell`, or with direnv and `.envrc`. It provides these tools:

| Directory | Tools from devenv |
| --- | --- |
| `animations/`, `websites/` | Node.js 26 and pnpm. devenv runs `pnpm install` in both directories |
| `bizserver/` | Rust from `bizserver/rust-toolchain.toml` through the `rust-overlay` input, `buf`, OpenSSL and `pkg-config` |
| `crates/` | The same Rust version as `bizserver/`. `crates/rust-toolchain.toml` repeats it for rustup users |
| `android/` | JDK 17 and `JAVA_HOME`. The Gradle wrapper provides Gradle |
| `websites/scripts/` | Python 3 with Pillow and rembg. `portraits.py` downloads the rembg model to `~/.u2net` on first use |

devenv does not provide Xcode, `ictool`, XcodeGen, the Android SDK, Chromium for `animations/` previews, Docker or PostgreSQL. Install them outside devenv. Do not add PostgreSQL to devenv, because `bizserver/AGENTS.md` requires the ArcBox Compose database. Do not add XcodeGen from nixpkgs unless its version matches the version that generated `ios/Boji.xcodeproj`. Add Python packages to `languages.python.package` in `devenv.nix`. Do not add `requirements.txt`, `pyproject.toml` or a virtual environment for them.

## Commands

- `devenv test` at the repository root runs the type check of `animations/`, verifies that `animations/lottie/` and `animations/lottie-library/` match their source, and runs the type check of `websites/`.
- The iOS and Android build and test commands are in `ios/AGENTS.md` and `android/AGENTS.md`.
- The website commands are in `websites/AGENTS.md`.
- `cargo locales check` in `crates/` validates `locales/` and verifies that the generated string resources are current. `cargo locales generate` writes them. See `crates/AGENTS.md`.
- `buf generate` in `ios/BojiAPI/` and in `android/rpc/` regenerates the Swift and Kotlin client code from `bizserver/proto/boji/v1/`. See "API contract" below.

### README icon

The root `README.md` shows `assets/public/boji-icon.png` in light mode and `assets/public/boji-icon-dark.png` in dark mode. Both files are exports of `ios/Boji/Resources/AppIcon.icon`. When the app icon changes, export both files again with `ictool` from Xcode. Run these commands at the repository root:

```sh
ICTOOL="/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
"$ICTOOL" ios/Boji/Resources/AppIcon.icon --export-image --output-file assets/public/boji-icon.png \
  --platform iOS --rendition Default --width 256 --height 256 --scale 2
"$ICTOOL" ios/Boji/Resources/AppIcon.icon --export-image --output-file assets/public/boji-icon-dark.png \
  --platform iOS --rendition Dark --width 256 --height 256 --scale 2
```

### README screenshots

The `## 功能` section of the root `README.md` shows six iPhone screenshots and two framed Apple Watch screenshots from `assets/public/screenshots/`. Each path has the form `screenshots/<platform>/<device>/<locale>/<screen>.png`, for example `screenshots/apple/iphone/zh-Hans/today.png`. Use the platform, device and locale names of `ios/app-store/screenshots/public/screenshots/`, and `watch` for Apple Watch. Name each file after the screen that it shows, not after its App Store position. The framed Apple Watch files add a model and a bezel variant: `<screen>/<model>/<variant>.png`.

The iPhone files are the simulator captures of the App Store screenshot editor in `ios/app-store/screenshots/`, scaled to 603 pixels wide. They show isolated test data. Use the raw iPhone captures, not the App Store exports, because the exports add captions and backgrounds. Before you add a capture, check it for personal data.

When the editor gets new captures, run these commands at the repository root in the devenv shell. The script uses Pillow from devenv:

```sh
SRC=ios/app-store/screenshots/public/screenshots/apple/iphone/zh-Hans
DST=assets/public/screenshots/apple/iphone/zh-Hans
python - "$SRC" "$DST" <<'EOF'
import sys
from pathlib import Path
from PIL import Image

src, dst = map(Path, sys.argv[1:])
dst.mkdir(parents=True, exist_ok=True)
names = {"04-habits": "today", "01-training": "training", "02-exercise": "exercise",
         "03-session": "session", "05-progress": "progress", "06-local": "settings"}
for old, new in names.items():
    with Image.open(src / f"{old}.png") as im:
        im = im.convert("RGB")
        im = im.resize((603, round(im.height * 603 / im.width)), Image.LANCZOS)
        im.save(dst / f"{new}.png", optimize=True)
EOF
```

The script writes RGB PNG files without metadata. If you add a device or a locale, use the same layout and update the screenshot tables in the `## 功能` section of `README.md`.

`screenshots/apple/watch/zh-Hans/today/` holds the 今日进度 screen of the watch app inside every Apple Product Bezel of Apple Watch Ultra 3 and Apple Watch Series 11: 57 RGBA PNG files with a transparent background. Each path has the form `today/<model>/<variant>.png`. `<variant>` is the case and band from the bezel file name, in lowercase with hyphens, for example `today/ultra-3-49mm/natural-ocean-band-anchor-blue.png`. `README.md` shows that file and `today/series-11-46mm/titanium-natural-milanese-loop.png`. `websites/src/lib/app.ts` loads the same Ultra 3 file from the asset host, so keep the file names stable.

| Model | Directory | Bezel | Screen opening |
| --- | --- | --- | --- |
| Apple Watch Ultra 3 (49mm) | `ultra-3-49mm` | 600 × 960 | 422 × 514 at (89, 223) |
| Apple Watch Series 11 (46mm) | `series-11-46mm` | 560 × 880 | 416 × 496 at (72, 192) |
| Apple Watch Series 11 (42mm) | `series-11-42mm` | 520 × 800 | 374 × 446 at (73, 177) |

The bezels come from [Apple Design Resources](https://developer.apple.com/design/resources/). Apple permits them in marketing for apps on Apple platforms under the [App Store marketing guidelines](https://developer.apple.com/app-store/marketing/guidelines/). Follow these rules:

- Use the bezel as is. Do not crop, tilt, recolor or animate it, do not add shadows or reflections, and do not put text on it.
- Show the bezel at least 200 pixels high. `README.md` shows both bezels at 40 percent, 240 × 384 and 224 × 352 pixels. Use one scale for all bezels, so that the models keep their relative size.
- Show the files without a table or a background color. A table cell adds a border and a background behind the transparent bezel.
- Capture on the simulator of the bezel model. Each screen opening is the native screen of that simulator.
- Do not add the bezel PNG files themselves to `assets/public/`. Section 3 of the Apple Design Resources license forbids distributing its components on a standalone basis. Commit only composites of a bezel and an app capture.
- Keep the Apple trademark credit line under the license table of `README.md`.

The editor has no Watch capture, because the UI tests start the iPhone app with `--uitesting`, and that argument turns off WatchConnectivity. To capture the Watch screen again:

1. Create a new iPhone simulator and a new watch simulator of the bezel model, so that the capture shows test records only. Pair them with `xcrun simctl pair <watch> <phone>`. The runtimes must have the same major version, for example iOS 26.5 and watchOS 26.5. Pair one watch at a time: when the iPhone simulator has two paired watches, the iPhone app shows 请先在 Apple Watch 安装薄肌 and does not sync.
2. Set both simulators to Simplified Chinese with `xcrun simctl spawn <udid> defaults write -g AppleLanguages -array zh-Hans` and `defaults write -g AppleLocale -string zh_CN`. Then restart the watch, so that its clock uses the 24-hour format.
3. Build with the simulator build command in `ios/AGENTS.md`. Install `Boji.app` on the iPhone first, then install `Boji.app/Watch/BojiWatch.app` on the watch with `xcrun simctl install`. The iPhone install removes a watch app that is already installed. Wait for `xcrun simctl bootstatus <watch>` before you install on the watch, and check the install with `xcrun simctl listapps <watch>`.
4. Start the iPhone app without `--uitesting`. Record water and sleep, then turn on 共享当天打卡状态 in Settings. The unsigned build also shows an App Group warning in Settings. The warning does not affect the watch screen.
5. Launch `club.leanmuscle.boji.watchkitapp` on the watch. When it shows 已连接 iPhone, capture it with `xcrun simctl io <watch> screenshot --type=png .work/watch.png`.
6. On Series 11 (46mm), the bottom edge of the first screen cuts the 同步于 line. Scroll 5 points before you capture: rotate the Digital Crown 0.05 turns with `XCUIDevice.shared.rotateDigitalCrown(delta: 0.05, velocity: .slow)` and save `XCUIScreen.main.screenshot()`. AppSim cannot send gestures to a watch simulator, and the repository has no watch UI test target, so put a temporary watchOS UI test project in `.work/` that drives `XCUIApplication(bundleIdentifier: "club.leanmuscle.boji.watchkitapp")`. Do not scroll further: from 0.06 turns, the scroll edge effect under the title blurs 已连接 iPhone. To capture another model, unpair the watch with `xcrun simctl unpair <pair>`, pair the next watch, install the watch app, and restart the iPhone app, so that it sends the snapshot again.
7. Download the Apple Watch Ultra 3 and Apple Watch Series 11 bezel packages from Apple Design Resources. Accept the license when you mount each disk image, and copy its `PNG/` directory to `.work/bezels/<package>/`. Then composite one model with this script at the repository root in the devenv shell. The arguments are the bezel directory, a file name filter, the capture, the model directory and the screen opening. The script converts each bezel to sRGB and writes RGBA PNG files without metadata.

```sh
python - .work/bezels/Ultra-3-2025 "AW Ultra 3 - " .work/watch.png ultra-3-49mm 89 223 <<'EOF'
import io
import re
import sys
from pathlib import Path
from PIL import Image, ImageCms

# Usage: python - <bezel PNG directory> <file name filter> <capture> <model> <x> <y>
src, name_filter, shot_path, model, x, y = sys.argv[1:]
out = Path("assets/public/screenshots/apple/watch/zh-Hans/today") / model
out.mkdir(parents=True, exist_ok=True)
shot = Image.open(shot_path).convert("RGBA")
srgb = ImageCms.createProfile("sRGB")
for path in sorted(Path(src).glob("*/*.png")):
    if name_filter not in path.name:
        continue
    frame = Image.open(path)
    icc = frame.info.get("icc_profile")
    frame = frame.convert("RGBA")
    if icc:
        frame = ImageCms.profileToProfile(frame, ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode="RGBA")
    # The capture must fill the transparent screen opening of the bezel.
    assert frame.getpixel((int(x) + shot.width // 2, int(y) + shot.height // 2))[3] == 0, path.name
    canvas = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    canvas.paste(shot, (int(x), int(y)))
    canvas.alpha_composite(frame)
    # "AW Ultra 3 - Natural + Ocean Band Anchor Blue.png" -> "natural-ocean-band-anchor-blue.png"
    variant = re.sub(r"[^a-z0-9]+", "-", path.stem.split(" - ")[-1].lower()).strip("-")
    canvas.save(out / f"{variant}.png", optimize=True)
    print(out / f"{variant}.png")
EOF
```

For Series 11, use `.work/bezels/Series-11-2025`, the filter `" - 46mm - "` or `" - 42mm - "`, and the model directory and screen opening from the table.

### README exercise images

The `## 功能` section of the root `README.md` also shows exercise images from `assets/public/previews/`. `animations/scripts/readme.ts` renders them from the Lottie files in both palettes:

| Path | Content |
| --- | --- |
| `previews/course/<palette>/<id>.png` | The poster frame of every course exercise, 240 pixels square. The course table shows them |
| `previews/course/<palette>/<id>.gif` | A looping GIF of each course exercise in `GIFS` of the script |
| `previews/library/<palette>/<id>.gif` | A looping GIF of each library exercise in `GIFS`. The exercise library section shows them |

`README.md` shows each image in a `<picture>` element. The `dark` file is the source for `prefers-color-scheme: dark`, and the `light` file is the default. Keep the library images in `previews/library/`, because the exercise library has a separate license.

Run `pnpm build` and then `pnpm readme` in `animations/` after you change a course exercise or the `GIFS` list. The script deletes `previews/course/` and `previews/library/` and writes them again. When `GIFS` changes, update the matching `<picture>` elements in `README.md`. Before you add a library exercise to `GIFS`, review its frames with `scripts/family.ts`, because most library families have no manual review.

## Cross-directory rules

### API contract

`bizserver/proto/` is the only source of the API contract. Its buf workspace is `bizserver/buf.yaml`, and `bizserver/buf.lock` pins googleapis. Clients use code that `buf generate` produces from that workspace. Do not copy proto files into a client, and do not hand-write request or response types.

The iOS code is the local Swift package `ios/BojiAPI/`. Its `buf.gen.yaml` pins the plugin versions, and its `Package.swift` pins the runtime versions. Keep each plugin version equal to its runtime: `apple/swift` to `swift-protobuf`, and `connectrpc/swift` to `connect-swift`.

The Android code is the library module `android/rpc/`. Its `buf.gen.yaml` pins the plugin versions, and `android/gradle/libs.versions.toml` pins the runtime versions. Keep `protocolbuffers/java` and `protocolbuffers/kotlin` at the protoc release of `protobuf`, and `connectrpc/kotlin` equal to `connectKotlin`.

Keep the googleapis commit in each `buf.gen.yaml` equal to `bizserver/buf.lock`. After a change to `bizserver/proto/boji/v1/`, run `buf generate` in `ios/BojiAPI/` and in `android/rpc/`. Commit the regenerated files of both clients in the same change.

### Asset host

`assets/public/` deploys to `https://assets.leanmuscle.club`. The file `assets/public/<path>` is served at `https://assets.leanmuscle.club/<path>`. This repository does not hold the deployment configuration.

Put only generic files here, such as the app icon, the app screenshots and the README exercise images. Keep a file that only one client or website uses in that directory, for example the website media in `websites/public/media/`.

Do not reference `files.manuscdn.com`, `/manus-storage/` or other hosted storage URLs. Store the file in the repository instead.

### Membership numbers

Treat membership numbers as opaque strings returned by the server.
Do not encode or describe server-side allocation or lifecycle policies in client code or public client documentation.
Render values without numeric conversion or assumptions about their format.

This rule applies to both clients and to all documentation in this repository.

### Exercise IDs

Three places use the same exercise IDs: `Exercise.id` in `ios/Boji/Models/BojiStore.swift`, the Android course model (`Workout.kt`), and `COURSES` in `animations/src/courses.ts`. Keep the IDs equal. If you rename or add a course exercise, update all three places and regenerate `animations/lottie/`.

The text of a course and its exercises is in `locales/`, groups `course` and `exercise`. The keys contain the ID with `_` for `-`: `course_<id>_title`, `course_<id>_subtitle`, `exercise_<id>_name` and `exercise_<id>_tip`. If you rename or add a course or an exercise, rename or add these keys too and run `cargo locales generate` in `crates/`. Article keys use a name instead of the numeric article ID, for example `article_first_workout_title`.

`LIBRARY` in `animations/src/courses.ts` holds animated exercises that no app course uses yet. Their files are in `animations/lottie-library/`, which no app bundles. When an app course adopts one, move it from `LIBRARY` to `COURSES` and regenerate.

### Shared copy

Copy that both clients show lives in `locales/`. `crates/locales/` generates `strings_shared.xml` in the `values*` directories of `android/app/src/main/res/` and `ios/Shared/Shared.xcstrings`. Do not edit the generated files. Edit `locales/`, run `cargo locales generate` in `crates/` and commit the source and the generated files together.

Keep the keys and argument names of `locales/meta/` stable, because both clients reference them in code. Copy that only one client shows stays in that client: `android/app/src/main/res/values/strings.xml` and `values-b+zh+Hans/strings.xml`, or the `Localizable.xcstrings` catalogs of `ios/`. When a client starts to show the same copy, move it into `locales/`.

Both clients ship Simplified Chinese and English, and English is the fallback language. Give every new piece of copy both languages. The app name is 薄肌 in Chinese and Lean Muscle in English.

`locales/locales.yaml` lists the targets that read generated files: `android` and `ios`. Xcode generates Swift symbols for `ios/Shared/Shared.xcstrings`, such as `.Shared.tabToday`. `cargo locales check` also compiles the iOS catalog with `xcstringstool`. See `ios/AGENTS.md` for the Swift usage.

### License and CLA

`LICENSE.md` holds the official text of the PolyForm Noncommercial License 1.0.0. Its first line is the `Required Notice:` line. AprilNEA LLC is the licensor and the CLA party. Do not edit the license text. Call the project source-available, not open source.

The license does not cover the names Boji, 薄肌 and 薄肌俱乐部, the app icon and the pass icons in `bizserver/assets/wallet/`, the Apple Root CA in `bizserver/assets/wallet/apple-root-ca.crt`, `websites/public/media/`, `websites/public/images/portraits/`, the app screenshots in `ios/app-store/screenshots/` and `assets/public/screenshots/`, the Apple Product Bezels in `ios/app-store/screenshots/public/frames/` and `websites/public/frames/`, the framed Watch screenshots in `assets/public/screenshots/apple/watch/`, the exercise library `animations/src/exercises/library/` and its images in `assets/public/previews/library/`, or third-party dependencies and fonts. The exercise library is available only under a separate commercial license from AprilNEA LLC. The `## 许可证` section of the root `README.md` lists the excluded content in a table with its directory. The table omits the names, because the license grants no trademark rights. When you add brand assets or third-party material, add them to that table.

`.github/CLA.md` is the contributor license agreement. `.github/workflows/cla.yml` asks each commit author of a pull request to sign it with a pull request comment. The workflow stores the signatures in `signatures/version1/cla.json` on the `cla-signatures` branch, and creates that branch on its first run. Do not protect `cla-signatures`, and do not merge it into `master`.

The workflow uses CLA Assistant Lite (`contributor-assistant/github-action`), which is archived. Keep the action pinned to the commit SHA of v2.6.1. Keep the "Prepare the signature file" step, because v2.6.1 fails when the signature file does not exist.

The check reads commit authors only. It does not read `Co-authored-by` trailers or the pull request author. The allowlist matches a commit author without a linked GitHub account by its free-text name, so an author name can bypass the check. Before you merge an external pull request, check its commit authors yourself.

If you change the terms of `.github/CLA.md`, raise its version number and set `CLA_SIGNATURES` in the workflow to the next path, for example `signatures/version2/cla.json`. Contributors then sign again. Fix typos without a new version.

### Accessibility statement

`docs/ACCESSIBILITY.md` is the accessibility statement. GitHub shows it as the Accessibility tab of the repository. It lists the status of iOS, Android and the website for each App Store Accessibility Nutrition Label. Keep only one copy, because GitHub reads `.github/ACCESSIBILITY.md` before `docs/ACCESSIBILITY.md`.

When you change accessibility behavior, update the affected status and the review date in the same change. Set a status to 已验证 only after a recorded check. Record the date, the environment and the result in the verification document of that directory, and write only the result in `docs/ACCESSIBILITY.md`. Keep development rules in the guide or design document of each directory, not in the statement.

### Error reporting

`bizserver/`, `ios/`, `android/` and `websites/` report errors to Sentry. `docs/sentry.md` lists the settings, the data that each project sends and the open release tasks. Keep it current when you change Sentry code or options.

- Sentry stays off when the DSN is empty. Keep that default in every build and in tests. Do not commit a real DSN.
- Do not send training, body or HealthKit records, membership numbers, account identity, email addresses, auth tokens, request headers, request bodies, URL query strings, screenshots or the view hierarchy.
- Performance tracing and Session Replay stay off. Turn one on only after you update `docs/sentry.md` and the privacy declarations of the affected app.

### Documentation language

Write human-facing documents in Chinese: `README.md` files, `docs/`, `ios/docs/` and `websites/docs/`. Write `AGENTS.md` files in English. `LICENSE.md` and `.github/CLA.md` are legal texts in English. Do not translate them in place.

## Git

Use `master` as the default branch.

Write commit messages in English and follow Conventional Commits.
Use a subject such as `feat: add membership cards`.
If a change touches one top-level directory, use that directory as the scope, for example `feat(ios): ...`.

Do not create a commit unless the user requests one.

Release tags use the form `<directory>/v<version>`, because each directory releases on its own. A `bizserver/v<version>` tag publishes the backend image. See "Release image" in `bizserver/AGENTS.md`. Do not push a release tag unless the user requests it.

When creating Git commits for this project, append exactly one trailer:

Co-authored-by: Manus <dev-agent@manus.ai>

Separate this trailer from the subject or body with a blank line. Preserve this attribution in future commits.

Commits are signed with the 1Password SSH agent. If signing fails, ask the user what to do. Do not disable signing without the user's approval.
