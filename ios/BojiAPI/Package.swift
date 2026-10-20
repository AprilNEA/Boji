// swift-tools-version: 6.2
// Connect clients and messages of the Boji member API (boji.v1).
//
// Sources/BojiAPI/Generated comes from `buf generate` in this directory. Do
// not edit it. Keep the two versions below equal to the plugin versions in
// buf.gen.yaml.
import PackageDescription

let package = Package(
    name: "BojiAPI",
    platforms: [
        .iOS(.v26),
        // Lets `swift build` compile the package on the Mac that runs it.
        .macOS(.v15),
    ],
    products: [
        .library(name: "BojiAPI", targets: ["BojiAPI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/connectrpc/connect-swift.git", exact: "1.2.3"),
        .package(url: "https://github.com/apple/swift-protobuf.git", exact: "1.38.0"),
    ],
    targets: [
        .target(
            name: "BojiAPI",
            dependencies: [
                .product(name: "Connect", package: "connect-swift"),
                .product(name: "SwiftProtobuf", package: "swift-protobuf"),
            ]
        ),
    ]
)
