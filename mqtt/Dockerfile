FROM node:lts-buster

RUN apt-get update && apt-get upgrade --yes

RUN mkdir -p /app/

COPY ../config.json /app/config.json
COPY ./mqtt/*.js /app/
COPY ./mqtt/*.json /app/

RUN cd /app && npm install

WORKDIR /app

CMD ["node", "/app/index.js"]
