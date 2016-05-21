# garagepi

This is a nodeJS application that runs on a Raspberry PI to control a garage door opener.  It uses the Express module to serve a single page application (SPA) and APIs that display the garage door status, history of the door being in the open position, a still picture from the camera, as well as controls to open and close the garage door.

The application displays the Raspberry PI CPU temp, as well as the ambient temp.  Web sockets are used to update the browser when the garage door changes position (open/close) as sensed by the door sensor.

## Networking
I have my home router configured to update a dynamic DNS service, so I can use a regular domain name instead of remembering my public IP address to access the web app.  My router then forwards to an NGINX server, which then forwards to the Raspberry Pi running the node application.

The application is secured with BASIC authentication (update username and password in config.json), so it is highly recommended to use HTTPS.  In my implementation, HTTPS is terminated in NGINX, with a forward to the Raspberry Pi, which is listening on socket 3000.

The following is a sample NGINX configuration that uses a self signed certificate and performs a proxy_pass to the Pi.  My internal DNS has garagepi and nginxservernamehere defined.  WWW traffic is sent to the /garagepi/ path, and web socket traffic is sent to /garagews/.

```
upstream garagepilogical {
        server garagepi:3000;
}

server {
        listen 8443 ssl;
        server_name nginxservernamehere;
        ssl_certificate cert.pem;
        ssl_certificate_key cert.key;
        ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers "HIGH:!aNULL:!MD5 or HIGH:!aNULL:!MD5:!3DES";
        ssl_prefer_server_ciphers on;
        location /garagepi/ {
                proxy_pass http://garagepilogical/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection $connection_upgrade;
        }
        location /garagews/ {
                proxy_pass http://garagepilogical/garagews/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection $connection_upgrade;
        }
}
```

## Parts
The following hardware is suggested:

* Raspberry PI with Raspbian and node installed.
* WiFi Module for connectivity.  [EdiMax EW-7811Un](http://amzn.com/B003MTTJOY).
* Raspberry PI/Arduino friendly relay module.  [SunFounder 5V Relay Shield Module for Arduino](http://amzn.com/B00E0NTPP4).
* Raspberry PI Camera module.
* DS18B20 1-wire thermometer sensor.
* 4.7k resistor (for DS18B20)
* Magnetic door/window switch.  [uxcell® MC 38 Wired Door Window Sensor Magnetic Switch](http://amzn.com/B00HR8CT8E).

![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePi_bb.png "Garage Pi Breadboard View")

Supplies for connecting and housing:

* Sheet metal.
* Stand-off screws and nuts for mounting.
* Micro-usb cable and charger for power.
* Ethernet cable for wire runs from relays to garage door opener and door sensor.
* Breadboard female to female and female to male jumper wire.
* Uxcell (orange) UY butt splice connectors.

## Tips 
I originally had this mounted right next to the garage door opener, but discovered that it interfered with the wireless operation of the garage door remotes.  Relocating it to the back wall of the garage, and mounting it with the sheet metal out solved the interference problem.

## Pictures
|Finished project, mounted on garage wall|Components|Camera|Door Sensor|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiMounted.jpg "Garage Pi Mounted")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiComponents.jpg "Garage Pi Components")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiCamera.jpg "Garage Pi Camera")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/DoorSensor.jpg "Door Sensor")|

|GPIO Left|GPIO Right|Relay to Opener|Relay to GPIO|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO.jpg "GPIO Left")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO2.jpg "GPIO Right")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoOpenerConnections.jpg "Relay to Opener")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoPiGPIOConnections.jpg "Relay to GPIO")|

|Main Page|Control|Menu|Door Open Log|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMain.png "Main Page")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWControl.png "Control")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMenu.png "Menu")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWLog.png "Log")|

##Steps
These steps include terminal commands, so a basic knowledge of using SSH is required.  PuTTY is a great terminal emulator for Windows.  Linux and Mac have ssh built in.

###Install Raspbian
[Raspbian](https://www.raspbian.org/) can be downloaded from the [Raspberry Pi Foundation](https://www.raspberrypi.org/downloads/raspbian/) site.  The most up to date instructions for downloading and installing on a SD card are found there.

Make sure Raspbian is all up to date.
```
sudo apt-update
sudo apt-upgrade
```

And the Raspberry Pi firmware is up to date.
```
sudo rpi-update
```

If rpi-update is not installed, install it with ```sudo apt-get install rpi-update```.

###Setup WiFi
This is probably one of the first things you'll want to do so you can SSH into the Pi.  Instructions can be found [here](https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md), but here's the core of it.

You can scan for WiFi networks using ```sudo iwlist wlan0 scan```.  You need to know your routers SSID and password.  This should work for WPA and WPA2.

Add the following to the bottom of the ```/etc/wpa_supplicant/wpa_supplicant.conf``` file.  In order to get permissions, you'll have to ```sudo vi /etc/wpa_supplicant/wpa_supplicant.conf```.

```
network={
    ssid="YourRouterSSID"
    psk="YourRouterPassword"
}
```

It should notice the file changed and try to connect to your router.

###Setup Raspbian for OneWire Support
Raspbian includes support for the OneWire bus used by the DS18B20 temperature sensor.  Here's how to enable it.

Add ```dtoverlay=w1-gpio``` to the /boot/config.txt.

Reboot with ```sudo reboot```.

With the sensor connected to GPIO 4, confirm it is recognized by going to the w1 devices folder, seeing a device listed starting with 28 (usually), and checking the w1_slave file for a reading.  My ID was 28-01156206bdff, so yours will be different.

```
pi@garagepi ~ $ cd /sys/bus/w1/devices
pi@garagepi /sys/bus/w1/devices $ ls
28-01156206bdff  w1_bus_master1
pi@garagepi /sys/bus/w1/devices $ cd 28-01156206bdff
pi@garagepi /sys/bus/w1/devices/28-01156206bdff $ cat w1_slave 
70 01 80 80 1f ff 80 80 7a : crc=7a YES
70 01 80 80 1f ff 80 80 7a t=23000
pi@garagepi /sys/bus/w1/devices/28-01156206bdff $
```

Make sure to update the garageapi.js file to have your ID.  (NOTE: in the future this setting should be moved into config.js)

```
// read ambient temp
setInterval(function(){
  ambtemp = utils.w1Temp('28-01156206bdff');
}, 5000);
```
##To Do

* Terminate HTTPS at the Raspberry Pi to reduce complexity of setup.
* Move hard-coded values into configuration, such as tempurature sensor ID and GPIO pins used.
* Clean-up dependencies.
* More detailed instructions on installation of OS, this and dependencies, networking, and wiring.
* Add support for second garage door.
