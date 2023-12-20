# BambuLab Printer Farm Monitor

Themes: Light, Minimal, Dark & Dark Minimal

<img src="docs/shot.png?raw=true" width="300"> <img src="docs/shot-dark.png?raw=true" width="300">
<img src="docs/shot-min.png?raw=true" width="300"> <img src="docs/shot-dark-min.png?raw=true" width="300">

You need to have Docker installed an running: https://www.docker.com/products/personal/

## Notes

I've only tested this on my Mac, but it "should just work".
I also only own and have access to my two X1C's, not sure if this will work with other models.

## TODO

* Integrate FTPS to view the contents of the printer.
  * Possibly allow uploads directly to a printer.

## Setup

There are a few things that need to be done/gathered with the printers:

* Enable "LAN Mode Liveview" (Not LAN Only)
  * From the Bambu icon on the printer, tap "General"
  * Enable the box next to "LAN Mode Liveview"
  * Write down the number next to "Device Info" (This is the device serial number)
* Grab the Access Code and IP Address
  * From the Bambu icon on the printer, tap "Network"
  * Write down the "Access Code"
  * Write down the "IP"

Now, create a `config.json` file in the repos main directory that looks like this:

If you install my [`bambu-cli`](https://github.com/davglass/bambu-cli), it's even easier: `bambu-cli config > config.json`

```json
{
    "machines": [
        {
            "id": "<Device Serial Number>",
            "name": "<Display Name of the printer>",
            "token": "<Access Code>",
            "ip": "<IP Address>"
        },
        {
            "id": "<Device Serial Number>",
            "name": "<Display Name of the printer>",
            "token": "<Access Code>",
            "ip": "<IP Address>"
        }
    ]
}
```

Create an entry for each printer you want to display.

## Launching

    docker-compose up --build

## Viewing

Now visit: https://127.0.0.1:9000/ to view all of your printers.

## Camera Issues

[Camera Issues](docs/CAMERA.md)

## Development

[Development Steps](docs/DEVELOP.md)

