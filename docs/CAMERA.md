# Camera Issues

The local `rtsps` stream on the X1C's seem to be limited to one connection per boot.

This means if you start your printer(s), then start this app it should work fine.

Now, if you restart this app WITHOUT restarting your printer the camera feed will be dead.

We will still see the `MQTT` data, just no camera. A reboot of the printer is required to get the stream back.

I *think* this is done by BambuLabs on purpose to conserve the memory/cpu on the printer itself. That makes sense to me.

I'm not sure if there is a way to "reset" this without rebooting the printers. But that's the only way I've been able to make it work.
