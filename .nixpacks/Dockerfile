FROM ghcr.io/railwayapp/nixpacks:ubuntu-1741046653

ENTRYPOINT ["/bin/bash", "-l", "-c"]
WORKDIR /app/


COPY .nixpacks/nixpkgs-5148520bfab61f99fd25fb9ff7bfbb50dad3c9db.nix .nixpacks/nixpkgs-5148520bfab61f99fd25fb9ff7bfbb50dad3c9db.nix
RUN nix-env -if .nixpacks/nixpkgs-5148520bfab61f99fd25fb9ff7bfbb50dad3c9db.nix && nix-collect-garbage -d

COPY .nixpacks/assets /assets/
ARG GIT_SHA NIXPACKS_METADATA
ENV GIT_SHA=$GIT_SHA NIXPACKS_METADATA=$NIXPACKS_METADATA

# setup phase
COPY . /app/.
RUN  mkdir /etc/nginx/ /var/log/nginx/ /var/cache/nginx/



# start
COPY . /app

CMD ["[[ -z \"${PORT}\" ]] && echo \"Environment variable PORT not found. Using PORT 80\" || sed -i \"s/0.0.0.0:80/$PORT/g\" /assets/nginx.conf && nginx -c /assets/nginx.conf"]

