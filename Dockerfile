# Dockerfile

FROM node:22-alpine
RUN mkdir -p /var/code
WORKDIR /var/code
COPY node_modules /var/code/node_modules
COPY dist /var/code/dist
COPY package.json /var/code/package.json
COPY Dockerfile /var/code/Dockerfile
COPY LICENSE /var/code/LICENSE
EXPOSE 8080
CMD [ "npm", "start"]