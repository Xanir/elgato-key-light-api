# Dockerfile

FROM node:24-alpine

ENV APP_PORT=8080
ENV mDNS_PORT=5353

RUN mkdir -p /var/code
WORKDIR /var/code

COPY node_modules /var/code/node_modules
COPY dist /var/code/dist
COPY package.json /var/code/package.json
COPY Dockerfile /var/code/Dockerfile
COPY LICENSE /var/code/LICENSE

EXPOSE ${mDNS_PORT}/udp
EXPOSE ${APP_PORT}

CMD [ "npm", "start"]