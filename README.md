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
* WiFi Module for connectivity.
* Raspberry PI/Arduino friendly relay module.
* Raspberry PI Camera module.
* DS18B20 1-wire thermometer sensor.
* 4.7k resistor (for DS18B20)
* Magnetic door/window switch, as used in home security systems.

Supplies for connecting and housing:

* Sheet metal.
* Stand-off screws and nuts for mounting.
* Micro-usb cable and charger for power.
* Ethernet cable for wire runs from relays to garage door opener and door sensor.
* Breadboard female to female and female to male jumper wire.
* Uxcell (orange) UY butt splice connectors.

## Tips 
I originally had this mounted right next to the garage door opener, but discovered that it interfered with the wireless operation of the garage door remotes.  Relocating it to the back wall of the garage, and mounting it with the sheet metal out solved the interference problem.

|Finished project, mounted on garage wall|Components|Camera|Door Sensor|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiMounted.jpg "Garage Pi Mounted")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiComponents.jpg "Garage Pi Components")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiCamera.jpg "Garage Pi Camera")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/DoorSensor.jpg "Door Sensor")|

|GPIO Left|GPIO Right|Relay to Opener|Relay to GPIO|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO.jpg "GPIO Left")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO2.jpg "GPIO Right")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoOpenerConnections.jpg "Relay to Opener")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoPiGPIOConnections.jpg "Relay to GPIO")|

|Main Page|Control|Menu|Door Open Log|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMain.png "Main Page")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWControl.png "Control")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMenu.png "Menu")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWLog.png "Log")|

To Do:

* Terminate HTTPS at the Raspberry Pi to reduce complexity of setup.
* Move hard-coded values into configuration, such as tempurature sensor ID and GPIO pins used.
* Clean-up dependencies.
* More detailed instructions on installation of OS, this and dependencies, networking, and wiring.
* Add support for second garage door.
