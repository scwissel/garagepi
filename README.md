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
* Stand-off screws and nuts for mounting. [M3 Standoff Spacers w/ Nuts](http://amzn.com/B00GWF32MU)  [M3 Screws](http://amzn.com/B00032Q1J4)
* Micro-usb cable and charger for power.
* Ethernet cable for wire runs from relays to garage door opener and door sensor.
* Breadboard [female to female and female to male jumper wire](http://amzn.com/B017NEGTXC).
* Uxcell (orange) [UY butt splice connectors](http://amzn.com/B00H8R5KRG).

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
These steps include terminal commands, so a basic knowledge of using SSH is required.  PuTTY is a great terminal emulator for Windows.  Linux and Mac have ssh built in.  Getting familiar with ```vi``` or ```nano``` to edit files in a shell is also needed.  Prefixing commands with ```sudo``` will elevate your access to run and edit files that require root permissions.  More info can be found [here](https://www.raspberrypi.org/documentation/linux/usage/root.md).

###Install Raspbian
[Raspbian](https://www.raspbian.org/) can be downloaded from the [Raspberry Pi Foundation](https://www.raspberrypi.org/downloads/raspbian/) site.  The most up to date instructions for downloading and installing on a SD card are found there.

Plug the Raspberry Pi to ethernet, or jump to the Setup WiFi section to get your Raspberry Pi on the network.

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

You probably have your Raspberry Pi connected to a monitor.  Ultimately, you need to go headless and to do that you need to keep the Raspberry Pi connected to your network.  Setting up WiFi makes this easier, so the only connection needed is power.

To access your Raspberry Pi on the network via secure shell (ssh), you'll need to get the IP address.  You can use the ```ifconfig``` command to list the network interfaces, which will include the IP address as ```inet addr```.  Knowing the IP address, you can now use PuTTY or a secure shell client from another machine to access the Raspberry Pi.

The default login for Raspbian is ```pi/raspberry```, as documented on the [Raspbian site](https://www.raspberrypi.org/documentation/linux/usage/users.md).  Changing the password is probably a good idea, since this device will be controlling your garage door.

###Setup WiFi
This is probably one of the first things you'll want to do so you can SSH into the Pi.  Plug in the wireless USB adapter to get started.  Instructions can be found [here](https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md), but here's the gist of it.

You can scan for WiFi networks using ```sudo iwlist wlan0 scan```.  This is an easy way to make sure the adapter is recognized and working.  To get connected, you need to know your routers SSID and password.  This should work for both WPA and WPA2 security.

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

###Setup Camera
Use ```raspi-config``` to enable the camera.  [More info](https://www.raspberrypi.org/documentation/configuration/camera.md)

###Setup Garage Door Position Sensor
With the reed switch connected to GPIO15 and a ground pin, here's how to test the operation.  ```gpio``` is a command-line utility that we'll use to test.

To set GPIO15 as an input pin, use ```gpio -g mode 15 in```.

To read the state of GPIO15, use ```gpio -g read 15```.  An output of ```0``` means the door is closed, ```1``` means the door is open.  This is the case for a "normally closed" reed switch.  In other words, when the magnet is away from the reed switch, the connection is closed (pin 15 is grounded).  When the magnet is near the reed switch, the connection opens.

###Setup the Garage Door Button Relay
With the relay connected to GPIO2, 5 volt and ground pins, we can use the ```gpio``` command-line to test the operation.

To set GPIO2 as an output pin, use ```gpio -g mode 2 out```.

To close the relay, we need to set the value to zero with ```gpio -g write 2 1```.

To open the relay, we need to set the value to one with ```gpio -g write 2 0```.

To simulate a button press where the relay closes for 250ms, the following script can be used as a test:

```
#!/bin/bash
gpio -g mode 2 out
gpio -g write 2 1
sleep .25
gpio -g write 2 0
```

###Install Dependencies
The following will install the other dependencies needed.  npm, Node.js and git are needed.

```
sudo apt-get install nodejs npm git
```

###Setup GaragePi
Grab garagepi from git using ```git clone https://github.com/scwissel/garagepi.git garagepi```.

Make sure to update the following:

* Temp sensor ID for your DS18B20 in garageapi.js.
* Your chosen username and password in config.js.

Start garagepi with ```node garageapi.js```.

Access the web application by browsing to the IP address of your Raspberry Pi on port 3000.  For example, if your Raspberry Pi has an IP address of 192.168.1.10, then use the following in your laptop or PC browser while connected to the same WiFi network as the Raspberry Pi: ```http://192.168.1.10:3000```.  You should get prompted to login with your username and password you setup in config.js and see the main page.

##To Do

* Terminate HTTPS at the Raspberry Pi to reduce complexity of setup.
* Move hard-coded values into configuration, such as tempurature sensor ID and GPIO pins used.
* Clean-up dependencies.
* More detailed instructions on installation of OS, this and dependencies, networking, and wiring.
* Add support for second garage door.
