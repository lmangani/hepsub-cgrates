/*
 * HEP-PUBSUB Interface Controller for CGRates
 * (C) 2019 QXIP BV
 */

try {
  var config = require('./config.js');
} catch(e) { console.log('Missing config!',e); process.exit(1); }

var express = require('express');
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json());

var port = config.service.port;

/* API SETTINGS */
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   next();
});

/* HEP Post Paths */
app.post('/get/:id', function (req, res) {
  if (config.debug) console.log('NEW API POST REQ', req.body);
  var data = req.body.data;
  if (!data) { res.send(500); return }
  if (!data.constructor === Array) data = [data];
  // Reduce to an Array containing the selected HEP Field
  var filtered_data = data.map(function (entry) {
    return entry[config.cgrates.hep_field];
  });
  if (filtered_data === undefined || filtered_data.length == 0) {
	res.status(500).end();
  } else {
    var settings = {
      "params": [
        {
          "OriginIDs": filtered_data
        }
      ],
      "id": 0,
      "method": "ApierV2.GetCDRs"
    };
    getCGrates(settings, res);
  }
})

app.listen(port, () => console.log('API Server started',port))

/* CGRATES API Proto */
var getCGrates = function(settings, res){
  try {
    if (!settings || !settings.params) { res.status(404).end(); return; }
    req({
      method: 'POST',
      url: config.cgrates.url || 'http://127.0.0.1:2080/jsonrpc',
      dataType: 'JSON',
      data: settings
    }, (err, response) => {
      if (err) {
        if (config.debug) console.log('CGRATES API ERROR', err.message)
        res.status(500).end();
      }
      if (config.debug) console.log('CGRATES API RESPONSE',response.body)
      res.send(response.body).end();
    })
  } catch(e) { console.error(e) }
}

/* HEP PUBSUB Hooks */
var req = require('req-fast');
var api = config.backend;
const uuidv1 = require('uuid/v1');
var uuid = uuidv1();
var ttl = config.service.ttl;

var publish = function(){
  try {
    var settings = config.service;
    settings.uuid = uuid;
    req({
      method: 'POST',
      url: api,
      dataType: 'JSON',
      data: settings
    }, (err, res) => {
      if (err) {
        if (config.debug) console.log('REGISTER API ERROR', err.message);
	process.exit(1);
      }
      if (config.debug) console.log('REGISTER API',res.body||'no response')
    })
  } catch(e) { console.error(e) }
}

/* REGISTER SERVICE w/ TTL REFRESH */
if (ttl) {
	publish();
	/* REGISTER LOOP */
	setInterval(function() {
	   publish()
	}, (.9 * ttl)*1000 );
}

/* END */
