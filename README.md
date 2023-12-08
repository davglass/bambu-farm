# BambuLab Printer Farm Monitor

You need to have Docker installed an running: https://www.docker.com/products/personal/

## Notes

I've only tested this on my Mac, but it "should just work".
I also only own and have access to my two X1C's, not sure if this will work with other models.

## TODO

* Figure out various camera issues.
* Add an AMS section with colors & filament data.
* Add the Temp/Fan data reported by BambuHandy

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

```json
[
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
```

Create an entry for each printer you want to display.

## Launching

    docker-compose up --build

## Viewing

Now visit: https://127.0.0.1:9000/ to view all of your printers.

### Known Issues

For me, once in a while the camera just stops reporting anything at all. Nothing from it seems to work. For this
I have to reboot the printer and it will work for a while. Once it stops, then I reboot it again.

I'm still working on figuring our WTF is causing that.
