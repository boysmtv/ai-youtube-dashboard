FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d /docker-entrypoint.d
COPY public /usr/share/nginx/html
