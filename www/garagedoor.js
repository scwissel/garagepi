
function getdow(date) {
  var weekday = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
  return weekday[date.getDay()];
}

function getage(date) {
  if (!date) return "";
  var now = new Date();
  var then = new Date(date);
  var secs = (now.getTime() - then.getTime()) / 1000;
  if (secs < 30) return "just now";
  if (secs < 60) return "a minute ago";
  if (secs < 120) return "a few minutes now";
  var mins = secs / 60;
  if (mins < 100) return Math.round(mins) + " minutes";
  var hours = mins / 60;
  return Math.round(hours) + " hours";
}

function getduration(startdate,enddate) {
  var secs = Math.trunc((enddate.getTime() - startdate.getTime()) / 1000);
  return secs;
} 

function gettextduration(startdate,enddate) {
  var secs = Math.trunc((enddate.getTime() - startdate.getTime()) / 1000);
  if (secs < 60) return secs + " second" + (secs > 1 ? "s" : "");
  var mins = Math.trunc(secs / 60);
  if (mins < 60) return mins + " minute" + (mins > 1 ? "s" : "");
  var hours = Math.trunc(mins / 60);
  var lmins = mins - (hours * 60); 
  if (lmins > 0) return hours + " hour" + (hours > 1 ? "s " : " ") + lmins + " minute" + (lmins > 1 ? "s" : "");
  return hours + " hour" + (hours > 1 ? "s" : "");
}

function getdatestring(d) {
  //var datestring = ("0"+(d.getMonth()+1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) +
  //  " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  var datestring = getdow(d) + " " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
  return datestring;
}

function displayunknown() {
  var data = {
    status: "Error",
    currentposition: "Unknown",
    asofdate: null,
    sincedate: "",
    message: "Disconnected from server." 
  }
  displaystatus(data);
}

function displaystatus(data) {
  $('#cputemp').html(data['cputemp']);
  $('#ambtemp').html(data['ambtemp']);
  $('#doorposition').html(data['currentposition']);
  if (data['currentposition'] === 'Closed') {
    $('#doorposition').removeClass('label-danger').addClass('label-success');
  } else {
    $('#doorposition').removeClass('label-success').addClass('label-danger');
  }
  $('#sincedate').html(gettextduration(new Date(data['sincedate']),new Date()));
  $('#asofdate').html(getage(data['asofdate']));
  $('#alertmessage').hide();
  $('#sincedatediv').show();
  if (data['status'] !== 'OK') {
    $('#alertmessage').html(data['message']);
    $('#alertmessage').show();
    $('#sincedatediv').hide();
  }
}

function getPositionHistoryMarkup(currentposition,item,enddate) {
  var markup = "";
  markup += '<li class="list-group-item">';
  if (item.position === "Closed") {
    markup += '<span class="label label-success">' + item.position + '</span>';
  } else {
    markup += '<span class="label label-danger">' + item.position + '</span>';
  }
  var secs = getduration(new Date(item.logdate),enddate);
  markup += ' ' + getdatestring(new Date(item.logdate)) + ' for ';
  if ((secs / 60) > 15 || (currentposition && currentposition !== "Closed")) {
    markup += '<mark><strong>' + gettextduration(new Date(item.logdate),enddate) + '</strong></mark>';
  } else {
    markup += gettextduration(new Date(item.logdate),enddate);
  }
  if (currentposition && currentposition !== "Closed") { markup += ' and counting'; }
  markup += '</li>';
  return markup;
}

function getPositionHistoryMarkupTABLE(item,enddate) {
  var markup = "";
  markup += '<tr>';
  if (item.position === "Closed") {
    markup += '<td><span class="label label-success">' + item.position + '</span></td>';
  } else {
    markup += '<td><span class="label label-danger">' + item.position + '</span></td>';
  }
  markup += '<td>' + getdatestring(new Date(item.logdate)) + ' for ' + gettextduration(new Date(item.logdate),enddate) + '</td>';
  markup += '</tr>';
  return markup;
}

function displaypositionhistoryloading(data) {
  document.getElementById("positionhistory_data").innerHTML = '<p>Loading...</p>';
}

function displaypositionhistoryunavailable(data) {
  document.getElementById("positionhistory_data").innerHTML = '<p>Unavailable</p>';
}

function displaypositionhistoryDISABLE(data) {
  var container = document.getElementById('positionhistory_data');
  var chart = new google.visualization.Timeline(container);
  var dataTable = new google.visualization.DataTable();
  dataTable.addColumn({ type: 'string', id: 'Position' });
  dataTable.addColumn({ type: 'date', id: 'Start' });
  dataTable.addColumn({ type: 'date', id: 'End' });
  var enddate = new Date();
  for (var i=0; i<data.log.length; i++) {
    dataTable.addRow([ data.log[i].position, new Date(data.log[i].logdate), enddate ]);
    enddate = new Date(data.log[i].logdate);
  }

  var options = {
    timeline: { colorByRowLabel: true,
                'width':800,
                'height':120 }
  };

  chart.draw(dataTable, options);
}

function displaypositionhistoryTABLE(data) {
  var out = "";
  out += '<table class="table">';
  var i;
  for(i = 0; i < data.log.length; i++) {
    if (data.log[i].position !== 'Closed') {
      out += getPositionHistoryMarkup(i===0?data.currentposition:null,data.log[i], i === 0 ? new Date() : new Date(data.log[i-1].logdate));
    }
  }
  out += '</table>';
  document.getElementById("positionhistory_data").innerHTML = out;
}

function displaypositionhistory(data) {
  var out = "";
  out += '<ul class="list-group">';
  var i;
  for(i = 0; i < data.log.length; i++) {
    if (data.log[i].position !== 'Closed') {
      out += getPositionHistoryMarkup(i===0?data.currentposition:null,data.log[i], i === 0 ? new Date() : new Date(data.log[i-1].logdate));
    }
  }
  out += '</ul>';
  document.getElementById("positionhistory_data").innerHTML = out;
}

function dooraction(action) {
  jQuery(document).ajaxError(function(event, request, settings){
    displayunknown();
  });
  var gdurl = document.URL + 'garagedoor/';
  var jqxhr = $.getJSON(gdurl + action, function(data) {
    console.log('door action response received');
    displaystatus(data);
  });
}

function refreshgaragepic() {
  //alert(document.getElementById('garagepic').src);
  document.getElementById('garagepic').src="images/latest.jpg?t=" + new Date().getTime();
}

function getpositionhistorytoday() {
    var starttm = new Date();
    starttm.setHours(0);
    starttm.setMinutes(0);
    starttm.setSeconds(0);
    starttm.setMilliseconds(0);
    var endtm = new Date();
    getpositionhistory(starttm,endtm);
}

function getpositionhistorysinceyesterday() {
    var starttm = (new Date(Date.now() + -24*3600*1000*1));
    starttm.setHours(0);
    starttm.setMinutes(0);
    starttm.setSeconds(0);
    starttm.setMilliseconds(0);
    var endtm = new Date();
    getpositionhistory(starttm,endtm);
}

function getpositionhistorylastweek() {
    var starttm = (new Date(Date.now() + -24*3600*1000*7));
    starttm.setHours(0);
    starttm.setMinutes(0);
    starttm.setSeconds(0);
    starttm.setMilliseconds(0);
    var endtm = new Date();
    getpositionhistory(starttm,endtm);
}

function getpositionhistory(starttm,endtm) {
  displaypositionhistoryloading();
  jQuery(document).ajaxError(function(event, request, settings){
    displaypositionhistoryunavailable();
  });
  //var starttm = new Date();
  //starttm.setHours(0);
  //starttm.setMinutes(0);
  //starttm.setSeconds(0);
  //starttm.setMilliseconds(0);
  //var endtm = new Date();
  var qobj = { starttm: starttm.getTime(), endtm: endtm.getTime() };
  var qstr = $.param( qobj );
  //alert (qstr);
  var gdurl = document.URL + 'garagedoor/log?' + qstr;
  var jqxhr = $.getJSON(gdurl, function(data) {
    console.log('positin history response received');
    displaypositionhistory(data);
    $('#historyasofdate').html(getdatestring(new Date()));
  });
}

window.onload = function () {
  
  //var socket = io(window.location.href.substr(0, location.href.lastIndexOf("/") + 1), { path: '/garagepi/socket.io' });
  //var socket = io('', { path: window.location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1) + 'socket.io' });
  var socket = io('', { path: '/garagews/socket.io' });
  var doorstatus;

  socket.on('status', function (data) {
    if (doorstatus && doorstatus.currentposition !== data.currentposition) {
      // only play alert if this is not the first status
      document.getElementById('dooralarm').play();
    }
    doorstatus = data;
    console.log(doorstatus);
    displaystatus(doorstatus);
  });

  $('#doorposition').click(function() {
    $('#remotecontrolmodal').modal('show');
  });
  $('#openbutton').click(function() {
    dooraction('open');
  });
  $('#closebutton').click(function() {
    dooraction('close');
  });
  //$('#refreshlogbutton').click(function() {
  //  getpositionhistorytoday();
  //});
  $('#lograngetoday').click(function() {
    getpositionhistorytoday();
  });
  $('#lograngesinceyesterday').click(function() {
    getpositionhistorysinceyesterday();
  });
  $('#lograngelastweek').click(function() {
    getpositionhistorylastweek();
  });
  $('#refreshpicbutton').click(function() {
    refreshgaragepic();
  });
  //dooraction('status');
  //setInterval(function(){ dooraction('status'); }, 5000);
  setInterval(function(){ displaystatus(doorstatus); }, 5000);

  getpositionhistorysinceyesterday();

  // this will close the hamburger menu after a selection
  $(document).on('click','.navbar-collapse.in',function(e) {
    if( $(e.target).is('a') && ( $(e.target).attr('class') != 'dropdown-toggle' ) ) {
        $(this).collapse('hide');
    }
  });
};

