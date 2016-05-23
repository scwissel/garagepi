var exec = require('child_process').exec;

var buttongpio = 2; // PIN 3 = GPIO2
var positiongpio = 15; // PIN 10 - GPIO15

var garagedoor = {

  init:        function () {
                 // initialize GPIO ports
                 console.log('opening GPIO port ' + positiongpio + ' as input');
                 exec('gpio -g mode ' + positiongpio + ' in');

                 console.log('opening GPIO port on pin ' + buttongpio + ' as output');
                 exec('gpio -g mode ' + buttongpio + ' out');
  },

  getpos:      function (callback) {
                 exec('gpio -g read ' + positiongpio, (error, stdout, stderr) => {
                   if (error) {
                     console.error('gpio read exec error: ${error}');
                     callback(error);
                   }
                   var pos = stdout.substring(0,1);
                   //console.log(`stdout: ${stdout} ${pos}`);
                   callback(null,pos);
                   //console.log(`stderr: ${stderr}`);
                 });
                 return;
  },

  pressbutton: function () {
                    exec('gpio -g write ' + buttongpio + ' 1');
                    setTimeout(function() {
                      exec('gpio -g write ' + buttongpio + ' 0');
                    }, 250);
  },

  close:       function() {
  }

};

module.exports = garagedoor;
