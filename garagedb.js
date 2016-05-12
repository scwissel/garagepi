var sqlite3 = require('sqlite3').verbose();

var db,
    stmtIns;

var garagedb = {

  init:     function (dbName) {
              db = new sqlite3.Database(dbName);
              db.serialize(function() {
                db.run("create table if not exists doorlog (logdate integer primary key, position text)");
                stmtIns = db.prepare("insert into doorlog values(?,?)");
              });
  },

  log:      function (date,position) {
              stmtIns.run(date.getTime(),position);
  },

  readlatestlog:  function(callback) {
              db.all("select logdate, position from doorlog where logdate in (select max(logdate) from doorlog) limit 1",
                function(err, rows) {
                  if (err) {
                    callback(err);
                    return;
                  }
                  callback(null,rows);
                  return;
              });
  },

  readlog:  function(startdate,enddate,callback) {
              db.all("select logdate, position from doorlog where logdate between " + startdate.getTime() +" and " + enddate.getTime() + " order by logdate desc",
                function(err, rows) {
                  if (err) {
                    callback(err);
                    return;
                  }
                  callback(null,rows);
                  return;
              });
  },

  close:    function() {
              stmtIns.finalize();
              db.close();
  }

};

module.exports = garagedb;
