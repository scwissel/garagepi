/**
 * utility library
 */

var basicAuth = require('basic-auth');
var fs =  require('fs');


/**
 * Simple basic auth middleware for use with Express 4.x.
 *
 * @example
 * app.use('/api-requiring-auth', utils.basicAuth('username', 'password'));
 *
 * @param   {string}   username Expected username
 * @param   {string}   password Expected password
 * @returns {function} Express 4 middleware requiring the given credentials
 */
exports.basicAuth = function(username, password) {
  return function(req, res, next) {
    var user = basicAuth(req);

    if (!user || user.name !== username || user.pass !== password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }

    next();
  };
};

exports.cpuTemp = function() {
  var cputemp = Math.round(((parseFloat(fs.readFileSync("/sys/class/thermal/thermal_zone0/temp"))/1000) * (9/5) + 32)*100)/100;
  return cputemp;
};

exports.w1Temp = function(serial) {
  var temp;
  var re=/t=(\d+)/;
  try {
    var text=fs.readFileSync('/sys/bus/w1/devices/' + serial + '/w1_slave','utf8');
    if (typeof(text) != "undefined") {
      if (text.indexOf("YES") > -1) {
        var temptext=text.match(re);
        if (typeof(temptext) != "undefined") {
          temp = Math.round(((parseFloat(temptext[1])/1000) * (9/5) + 32)*100)/100;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
  return temp;
};
