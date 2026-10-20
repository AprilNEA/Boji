{ pkgs, ... }:
{
  # Toolchain for animations/ and web/: Node.js LTS, pnpm, tsx and TypeScript (via pnpm).
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    directory = "./animations";
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  # languages.javascript installs one directory only, so install web/ here.
  tasks."web:install" = {
    exec = ''
      cd "$DEVENV_ROOT/web"
      pnpm install --frozen-lockfile
    '';
    before = [ "devenv:enterShell" "devenv:enterTest" ];
  };

  enterTest = ''
    set -e
    cd "$DEVENV_ROOT/animations"
    pnpm typecheck
    pnpm check
    cd "$DEVENV_ROOT/web"
    pnpm typecheck
  '';
}
