import AppKit

// Source-controlled icon; run from the ios/ directory: swift scripts/generate-app-icon.swift
let directory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("Boji/Resources/Assets.xcassets/AppIcon.appiconset")
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

for dark in [false, true] {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1024, pixelsHigh: 1024,
                                 bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                 isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else { fatalError("Cannot create icon context") }
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    let orange = NSColor(srgbRed: 0.78, green: 0.25, blue: 0.12, alpha: 1)
    (dark ? NSColor(srgbRed: 0.12, green: 0.14, blue: 0.12, alpha: 1) : orange).setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: 1024, height: 1024)).fill()
    let font = NSFont.systemFont(ofSize: 790, weight: .heavy)
    let rounded = NSFont(descriptor: font.fontDescriptor.withDesign(.rounded)!, size: 790)!
    let text = NSAttributedString(string: "b", attributes: [.font: rounded, .foregroundColor: dark ? orange : NSColor(srgbRed: 0.99, green: 0.97, blue: 0.91, alpha: 1)])
    let size = text.size()
    text.draw(at: NSPoint(x: (1024 - size.width) / 2, y: (1024 - size.height) / 2 + 30))
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()
    let opaqueData = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 1.0])!
    let opaque = NSBitmapImageRep(data: opaqueData)!
    try opaque.representation(using: .png, properties: [:])!.write(to: directory.appendingPathComponent(dark ? "icon-dark.png" : "icon.png"))
}
let manifest = """
{"images":[{"filename":"icon.png","idiom":"universal","platform":"ios","size":"1024x1024"},{"appearances":[{"appearance":"luminosity","value":"dark"}],"filename":"icon-dark.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
"""
try manifest.write(to: directory.appendingPathComponent("Contents.json"), atomically: true, encoding: .utf8)
