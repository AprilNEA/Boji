{ pkgs, ... }:
{
  # Toolchain for animations/: Node.js LTS, pnpm, tsx and TypeScript (via pnpm).
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    directory = "./animations";
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  enterTest = ''
    cd animations
    pnpm typecheck
    pnpm check
  '';
}
