FROM node:lts-buster

RUN apt-get update && apt-get upgrade --yes

RUN mkdir -p /app/

COPY ./app/ /app/
COPY ../config.json /app/config.json

RUN cd /app && npm install

WORKDIR /app

CMD ["node", "/app/index.js"]
