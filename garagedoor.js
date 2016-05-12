var gpio = require('pi-gpio');

var buttonpin = 3; // PIN 3 = GPIO2
var positionpin = 10; // PIN 10 - GPIO15

var garagedoor = {

  init:        function () {
                 // initialize GPIO ports
                 console.log('opening GPIO port on pin ' + positionpin + ' as input');
                 gpio.close(positionpin); // close it, in case it was left open previously
                 gpio.open(positionpin, "input", function (err) {
                   if (err) {
                     gpio.close(positionpin);
                     throw err;
                   }
                 });

                 console.log('opening GPIO port on pin ' + buttonpin + ' as output');
                 gpio.close(buttonpin); // close it, in case it was left open previously
                    gpio.open(buttonpin, "high", function (err) {  // direction of "high" is output defaulted to 1 (high)
                 if (err) {
                     gpio.close(buttonpin);
                     throw err;
                   }
                 });
  },

  getpos:      function (callback) {
                 gpio.read(positionpin, function (err, value) {
                   if (err) {
                     callback(err);
                     return;
                   }
                   callback(null,value);
                   return;
                 });
  },

  pressbutton: function () {
                    gpio.write(buttonpin,0);
                    setTimeout(function() {
                      gpio.write(buttonpin,1);
                    }, 250);
  },

  close:       function() {
                 gpio.close(positionpin);
                 gpio.close(buttonpin);
  }

};

module.exports = garagedoor;
