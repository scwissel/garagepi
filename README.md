# garagepi

This is an nodeJS application that runs on a Raspberry PI.

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

|Finished project, mounted on garage wall|Components|Camera|Door Sensor|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiMounted.jpg "Garage Pi Mounted")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiComponents.jpg "Garage Pi Components")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiCamera.jpg "Garage Pi Camera")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/DoorSensor.jpg "Door Sensor")|

|GPIO Left|GPIO Right|Relay to Opener|Relay to GPIO|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO.jpg "GPIO Left")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiGPIO2.jpg "GPIO Right")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoOpenerConnections.jpg "Relay to Opener")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiRelaytoPiGPIOConnections.jpg "Relay to GPIO")|

|Main Page|Control|Menu|Door Open Log|
|---|---|---|---|
|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMain.png "Main Page")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWControl.png "Control")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWMenu.png "Menu")|![alt text](https://github.com/scwissel/garagepi/raw/master/docs/GaragePiWWWLog.png "Log")|
