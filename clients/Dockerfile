FROM node:lts-buster

RUN apt-get update && apt-get upgrade --yes && apt-get install --yes ffmpeg

RUN mkdir -p /app/bin
RUN mkdir -p /app/config

COPY ../config.json /app/config/config.json
COPY ../clients/bin/*.js /app/bin/

WORKDIR /app

CMD ["node", "/app/bin/start.js"]
