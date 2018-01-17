'use strict';

var http = require('http');
var path = require('path');

var Service;
var Characteristic;

var WINDOW_PATH = '/window';

var ESP8266WindowPositionState = Object.freeze({
  Decreasing: 0,
  Increasing: 1,
  Stopped: 2
});

function ESP8266Window(log, config) {
  this._log = log;

  this._name = config.name;
  this._hostname = config.hostname;
  this._port = config.port;
  this._window = config.window;
}

ESP8266Window.prototype.identify = function (cb) {
  this._log('Identify requested');
  cb();
};

ESP8266Window.prototype.setTargetPosition = function (value, cb) {
  this._log('Setting target position: ' + value);

  var self = this;

  var postData = "value="+String(value);

  var options = {
    hostname: self._hostname,
    port: self._port,
    path: path.join(WINDOW_PATH, self._window, 'targetSetPosition'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var req = http.request(options, function (res) {
    switch (res.statusCode) {
      case 200:
        break;
      default:
        cb(new Error('Response status code: ' + res.statusCode));
        return;
    }
    cb();
  });

  req.write(postData);

  req.on('error', function (err) {
    cb(err);
  });

  req.end();
};

ESP8266Window.prototype.getTargetPosition = function (cb) {
  this._log('Getting target position');

  var self = this;

  var options = {
    hostname: self._hostname,
    port: self._port,
    path: path.join(WINDOW_PATH, self._window, 'targetPosition'),
    method: 'GET'
  };

  var req = http.request(options, function (res) {
    switch (res.statusCode) {
      case 200:
        break;
      default:
        cb(new Error('Response status code: ' + res.statusCode));
        return;
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var body = JSON.parse(chunk);
      cb(null, body);
    });
  });

  req.on('error', function (err) {
    cb(err);
  });

  req.end();
};

ESP8266Window.prototype.getCurrentPosition = function (cb) {
  this._log('Getting current position');

  var self = this;

  var options = {
    hostname: self._hostname,
    port: self._port,
    path: path.join(WINDOW_PATH, self._window, 'currentPosition'),
    method: 'GET'
  };

  var req = http.request(options, function (res) {
    switch (res.statusCode) {
      case 200:
        break;
      default:
        cb(new Error('Response status code: ' + res.statusCode));
        return;
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var body = JSON.parse(chunk);
      cb(null, body);
    });
  });

  req.on('error', function (err) {
    cb(err);
  });

  req.end();
};

ESP8266Window.prototype.getPositionState = function (cb) {
  this._log('Getting position state');

  var self = this;

  var options = {
    hostname: self._hostname,
    port: self._port,
    path: path.join(WINDOW_PATH, self._window, 'positionState'),
    method: 'GET'
  };

  var req = http.request(options, function (res) {
    switch (res.statusCode) {
      case 200:
        break;
      default:
        cb(new Error('Response status code: ' + res.statusCode));
        return;
    }
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var body = JSON.parse(chunk);
      var state = Characteristic.PositionState.STOPPED;
      switch (body) {
        case ESP8266WindowPositionState.Decreasing:
          state = Characteristic.PositionState.DECREASING;
          break;
        case ESP8266WindowPositionState.Increasing:
          state = Characteristic.PositionState.INCREASING;
          break;
        case ESP8266WindowPositionState.Stopped:
          state = Characteristic.PositionState.STOPPED;
          break;
      }
      cb(null, state);
    });
  });

  req.on('error', function (err) {
    cb(err);
  });

  req.end();
};

ESP8266Window.prototype.getServices = function () {
  var services = [];

  var informationService = new Service.AccessoryInformation();
  informationService
    .setCharacteristic(Characteristic.Manufacturer, "ESP_Klu")
    .setCharacteristic(Characteristic.Model, "ESP8266 Window")
    .setCharacteristic(Characteristic.SerialNumber, "A0123456789");
  services.push(informationService);

  var windowService = new Service.WindowCovering(this.name);
  windowService
    .getCharacteristic(Characteristic.TargetPosition)
    .on('set', this.setTargetPosition.bind(this));
  windowService
    .getCharacteristic(Characteristic.TargetPosition)
    .on('get', this.getTargetPosition.bind(this));
  windowService
    .getCharacteristic(Characteristic.CurrentPosition)
    .on('get', this.getCurrentPosition.bind(this));
  windowService
    .getCharacteristic(Characteristic.PositionState)
    .on('get', this.getPositionState.bind(this));
  services.push(windowService);

  return services;
};

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-esp-windowshades",
    "ESP8266Windowshades", ESP8266Window);
};
