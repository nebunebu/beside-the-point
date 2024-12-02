{
  description = "beside-the-point";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = inputs: {
    packages = builtins.mapAttrs
      (system: _:
        let pkgs = inputs.nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.callPackage { };
        }
      )
      inputs.nixpkgs.legacyPackages;

    devShells = builtins.mapAttrs
      (
        system: _:
          let
            pkgs = inputs.nixpkgs.legacyPackages.${system};
          in
          {
            default = pkgs.mkShell {
              name = "beside-the-point";
              packages = [
                pkgs.nodePackages.npm
                pkgs.nodejs
              ];
            };
          }
      )
      inputs.nixpkgs.legacyPackages;
  };
}
