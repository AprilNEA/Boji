{ pkgs, lib, ... }:
{
  # Toolchain for animations/ and websites/: Node.js LTS, pnpm, tsx and TypeScript (via pnpm).
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    directory = "./animations";
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  # Toolchain for bizserver/. bizserver/rust-toolchain.toml sets the Rust version and components.
  languages.rust = {
    enable = true;
    toolchainFile = ./bizserver/rust-toolchain.toml;
  };

  # Toolchain for android/: JDK 17 and JAVA_HOME. The Gradle wrapper provides Gradle,
  # and android/local.properties points to the Android SDK. Android Studio uses its own JDK.
  languages.java = {
    enable = true;
    jdk.package = pkgs.jdk17;
    lsp.enable = false;
  };

  packages = [
    # bizserver/build.rs compiles the protobuf files with protoc through connectrpc-build.
    pkgs.protobuf
    # bizserver/: `buf lint`.
    pkgs.buf
    # bizserver/: better-auth links openssl-sys through josekit and webauthn-rs-core.
    pkgs.openssl
    pkgs.pkg-config
  ];

  # On macOS, openssl-sys checks Homebrew paths before pkg-config. Point it at the devenv OpenSSL.
  env.OPENSSL_LIB_DIR = "${lib.getLib pkgs.openssl}/lib";
  env.OPENSSL_INCLUDE_DIR = "${lib.getDev pkgs.openssl}/include";

  # languages.javascript installs one directory only, so install websites/ here.
  tasks."websites:install" = {
    exec = ''
      cd "$DEVENV_ROOT/websites"
      pnpm install --frozen-lockfile
    '';
    before = [ "devenv:enterShell" "devenv:enterTest" ];
  };

  enterTest = ''
    set -e
    cd "$DEVENV_ROOT/animations"
    pnpm typecheck
    pnpm check
    cd "$DEVENV_ROOT/websites"
    pnpm typecheck
  '';
}
