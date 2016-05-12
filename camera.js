var exec = require('child_process').exec;

var picturepath;

var camera = {

  init:        function (path) {
                 picturepath = path;
  },

  takepicture: function () {
                 var now = new Date(),
                     fileName = picturepath + '/latest.jpg';

                 exec('raspistill -o ' + fileName + ' -w 1920 -h 1080 -q 15 -rot 0 -a "' + now.toString() + '" -th 480:270:90', function (err, stdin, stdout) {
                   if (err) {
                     throw err;
                   }
                 });
  }

};

module.exports = camera;
