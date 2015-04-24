'use strict';

var CronJob = require('cron').CronJob;
var MongoClient = require('mongodb').MongoClient,
	assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/myproject';
MongoClient.connect(url, function(err, db) {

	function checkCalendar () {
		console.log('tick');
	}

	new CronJob({
	  cronTime: '0 * * * * *',
	  onTick: checkCalendar,
	  start: true
	});
});