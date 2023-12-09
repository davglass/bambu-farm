# Developing against the source

This app is comprised of 4 Docker containers:

* `rtsp-server`: [mediamtx](https://github.com/bluenviron/mediamtx)
  * This is what serves the converted `rtsps` stream into a `WebRTC` stream for the browser
* `rtsp-clients`: Uses a Node.js container to lauch the streams with `ffmpeg` and publish them to `rtsp-server`
* `mqtt`: Connects to the printers to their local `MQTT` server
  * It then parses the topics and cleans up some of the data, then publishes a `WebSocket` server for the browser to listen to
* `app`: Node.js Express web app that serves the page, loads the streams and listens to the `WebSocket` server.

## What I do

Comment out the `app` portion of the `docker-compose.yaml` file:

```
#  app:
#    build:
#      dockerfile: ./app/Dockerfile
#    depends_on:
#      - rtsp-server
#      - rtsp-clients
#      - mqtt
#    ports:
#      - "9000:9000"
```

Now start the containers: `docker-compose up --build`

In another terminal, `cd app && ./index.js`

This way you can work on the Express app without having to build to container all the time.

Each of the containers can pretty much run by themselves as well if you want to work on them too.
