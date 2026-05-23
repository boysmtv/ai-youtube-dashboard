FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d /docker-entrypoint.d
COPY public /usr/share/nginx/html
HEALTHCHECK --interval=60s --timeout=20s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
