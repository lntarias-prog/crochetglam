{ }:

let pkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/5148520bfab61f99fd25fb9ff7bfbb50dad3c9db.tar.gz") { overlays = [  ]; };
in with pkgs;
  let
    APPEND_LIBRARY_PATH = "${lib.makeLibraryPath [  ] }";
    myLibraries = writeText "libraries" ''
      export LD_LIBRARY_PATH="${APPEND_LIBRARY_PATH}:$LD_LIBRARY_PATH"
      
    '';
  in
    buildEnv {
      name = "5148520bfab61f99fd25fb9ff7bfbb50dad3c9db-env";
      paths = [
        (runCommand "5148520bfab61f99fd25fb9ff7bfbb50dad3c9db-env" { } ''
          mkdir -p $out/etc/profile.d
          cp ${myLibraries} $out/etc/profile.d/5148520bfab61f99fd25fb9ff7bfbb50dad3c9db-env.sh
        '')
        nginx
      ];
    }
