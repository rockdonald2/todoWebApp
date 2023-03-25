FROM nginx:1.22.1

# copy all dist content to nginx's static folder
COPY dist/ /usr/share/nginx/html

EXPOSE 80