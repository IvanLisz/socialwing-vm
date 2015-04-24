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




	/*
	function streamTweets () {
		var stream = userTw.stream('statuses/filter', {track: 'hola'});

		stream.on('tweet', function (data) {
			console.log('streem data:');
			console.log(data.text);
		});

		setTimeout(function() {
			stream.stop();
			context.succeed('force');
		}, 2000);
	}
	*/