FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY . /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O - http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
