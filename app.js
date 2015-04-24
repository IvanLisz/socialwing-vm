'use strict';

var CronJob 		= require('cron').CronJob,
	MongoClient 	= require('mongodb').MongoClient,
	assert 			= require('assert'),
	Twit 			= require('twit');

// Connection URL
var url = 'mongodb://localhost:27017/monk';
/*MongoClient.connect(url, function(err, db) {


	var collection = db.collection('calendar');

	function checkCalendar () {
		console.log('tick');
		var nowMinute = getNowMinute();
		console.log(nowMinute);
		collection.find({
			timestamp: {
				"$lt" : nowMinute + 600010,
				"$gt" : nowMinute - 1

			}
		}).each(function (err, data) {
			if (err || !data){
				return;
			}
			console.log("data");
			streamTweets(data);
		});
	}

	new CronJob({
	  cronTime: '* * * * * *',
	  onTick: checkCalendar,
	  start: true
	});
});*/

var data = { follow: 20 };
streamTweets(data);

function streamTweets (data) {

	var userTw = new Twit({
		consumer_key: 'xRChrKNAflVpEKC1Z6aSgSYgi',
		consumer_secret: 'rVbSrrdcxQBJqWLjYlzXBvhlCgFIKuYYVAAjVYWUXiW2tjxRNT',
		access_token: '630725899-GXXJR3QokYVt5GNu5ANDxU8u5HqhBfUCyP9v7hHE',
		access_token_secret: 'mABYxaG1GmXKXKrtrcuP3S9uodRE8jqb3KfC9RurGNIcz'
	});

	var stream = userTw.stream('statuses/filter', {track: 'hola'});

	var tweets = 1;
	var users = [];
	stream.on('tweet', function (tweet) {
		if(tweets <= data.follow){
			console.log(users.indexOf(tweet.user.screen_name) );
			if (users.indexOf(tweet.user.screen_name) >=  0){
				return;
			}

			console.log('streem tweet:');
			console.log(tweet.user.screen_name + " " + tweet.text);

			users.push(tweet.user.screen_name);
			tweets++;

		}else{
			stream.stop();
		}
	});
}

function getNowMinute () {
	var now = new Date; // now
	now.setSeconds(0); // set seconds to 0
	return Math.floor(now / 1000) * 1000;
}
