//var http = require('http');
//var express = require('express');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { path: '/garagews/socket.io' });
var morgan = require('morgan');
var utils = require('./utils.js');
var garagedb = require('./garagedb.js');
var garagedoor = require('./garagedoor.js');
var camera = require('./camera.js');
var config = require('./config.json');
var cputemp = 0;
var ambtemp = 0;

var garagedoorrec = [{ value: null, position: null, asofdate: null, sincedate: null }];

// initialize DB
console.log('initializing database');
garagedb.init('garagedb.db');

// get latest record from the database
garagedb.readlatestlog(function(err,recs) {
  //console.log("latest records read: " + recs.length);
  if (recs.length > 0) {
    garagedoorrec.asofdate = new Date();
    garagedoorrec.sincedate = new Date(recs[0].logdate);
    garagedoorrec.position = recs[0].position;
    if (garagedoorrec.position === "Closed") { garagedoorrec.value = "0"; }
    if (garagedoorrec.position === "Open")   { garagedoorrec.value = "1"; }
  }
});

// initialize garage door API through GPIO
console.log('initializing garage door');
garagedoor.init();


if (config.camera.enabled) {
  // initialize camera
  console.log('initializing camera');
  camera.init(config.camera.imagepath);

  // take pictures
  setInterval(function(){
    camera.takepicture();
  }, config.camera.intervalsecs * 1000);
}


// read CPU temp
if (config.cputempsensor.enabled) {
  setInterval(function(){
    cputemp = utils.cpuTemp();
  }, config.cputempsensor.intervalsecs * 1000);
}

// read ambient temp
if (config.ambtempsensor.enabled) {
  setInterval(function(){
    ambtemp = utils.w1Temp(config.ambtempsensor.w1deviceid);
  }, config.ambtempsensor.intervalsecs * 1000);
}

// get garage door position and keep updated
setInterval( function () {
  // read GPIO input port
  garagedoor.getpos(function (err, value) {
    if (err) {
      throw err;
    }
    updatestatus(value);
  });
}, config.garagedoorpositionsensor.intervalsecs * 1000);

function updatestatus(value) {
  garagedoorrec.asofdate = new Date();
  if (value.toString() !== garagedoorrec.value) { // did the value actually change
    var gdorigvalue = garagedoorrec.value;
    garagedoorrec.sincedate = new Date(garagedoorrec.asofdate.getTime());
    garagedoorrec.value = value.toString(); // store value as a string
    garagedoorrec.position = "Unknown";
    if (garagedoorrec.value === "0") { garagedoorrec.position = "Closed"; }
    if (garagedoorrec.value === "1") { garagedoorrec.position = "Open"; }

    // original value was a valid value, then log the change in door position
    if (gdorigvalue === "0" || gdorigvalue === "1") {
      garagedb.log(garagedoorrec.asofdate,garagedoorrec.position);
    }
    io.emit('status',getresponse());
  }
}

function pressbutton() {
  garagedoor.pressbutton();
}

function getresponse() {
  var response = { status: "OK",
                   currentposition: garagedoorrec.position,
                   asofdate: garagedoorrec.asofdate,
                   sincedate: garagedoorrec.sincedate,
                   cputemp: cputemp,
                   ambtemp: ambtemp,
                   message: null };
  return response;
}

//app.use(morgan('combined'));
app.use('/',utils.basicAuth(config.www.username, config.www.password));

app.use(express.static(__dirname + "/www", { maxAge: 0 } ));

io.on('connection', function(socket) {
  console.log('client connected');
  socket.emit('status',getresponse());
});

// Express route for incoming requests for the garage door
app.get('/garagedoor/:command', function(req, res) {
  var cmdresponse = getresponse();
  
  if (req.params.command === 'status') {
    // just the response is all that is needed
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'open') {
    if (cmdresponse.currentposition !== "Open") {
      pressbutton();
    } else {
      cmdresponse.status = "Error";
      cmdresponse.message = "Door already open.";
    }
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'close') {
    if (cmdresponse.currentposition !== "Closed") {
      pressbutton();
    } else {
      cmdresponse.status = "Error";
      cmdresponse.message = "Door already closed.";
    }
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'toggle') {
    pressbutton();
    res.status(200).send(cmdresponse);
  } else if (req.params.command === 'log') {
    console.log("getting log");
    var starttm = (new Date(Date.now() + -24*3600*1000*3));
    var endtm = new Date();
    //console.log("qstarttm: " + req.query.starttm + " qendtm: " + req.query.endtm);
    if (req.query.starttm) { starttm = new Date(parseInt(req.query.starttm)); }
    if (req.query.endtm) { endtm = new Date(parseInt(req.query.endtm)); }
    //console.log("starttm: " + starttm + " endtm: " + endtm);
    garagedb.readlog(starttm, endtm, function(err,recs) {
      //console.log("records read: " + recs.length);
      cmdresponse.log = recs;
      //recs.forEach(function(row) {
      //  console.log("logdate: " + (new Date(row.logdate).toString()) + " position: " + row.position);
      //});
      res.status(200).send(cmdresponse);
    });
    
  } else {
    cmdresponse.status = "Error";
    cmdresponse.message = "Invalid command: " + req.params.command;
    res.status(200).send(cmdresponse);
  }
}); 

// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send('Oops, Something went wrong!');
    console.log(req);
  } else {
    console.log(req);
    next(err);
  }
});

//app.listen(config.www.port);
io.listen(app.listen(config.www.port));
console.log('App Server running at port ' + config.www.port);


