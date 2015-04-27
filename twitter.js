var Twit 		= require('twit'),
	credentials = require('./credentials');

function stream (user, limit, callback) {

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.key,
		access_token_secret: user.secret
	});

	var stream = userTw.stream('statuses/filter', { track: user.track, language: 'es' });
	var usersToFollow = [];
	stream.on('tweet', function (tweet) {
		if (usersToFollow.length < limit) {
			if (usersToFollow.indexOf(tweet.user.id) >=  0) {
				return;
			}
			console.log(tweet.text);
			usersToFollow.push(tweet.user.id);
		} else {
			stream.stop();
			callback(usersToFollow);
		}
	});
}

function checkFollowers (user, usersToCheck, callback) {

	if (usersToCheck.constructor !== Array) {
		return callback('Need usersToCheck to be an array');
	}

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.key,
		access_token_secret: user.secret
	});

	userTw.get('friendships/lookup', { user_id: usersToCheck.join() }, function (err, usersChecked){
		if (err) {
			return callback('Error while looking up friendships of: ' + usersToCheck.join());
		}
		var notFollowers = [];
		usersChecked.forEach(function (userChecked) {
			if (userChecked.connections.indexOf('followed_by') === -1) {
				notFollowers.push(userChecked.id);
			}
		});
		callback(null, notFollowers);
	});
}

module.exports = {
	stream: stream,
	checkFollowers: checkFollowers
};