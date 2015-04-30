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
			if (usersToFollow.map(function (uData){ return uData.id }).indexOf(tweet.user.id) >=  0 || checkDifference(user, tweet.user) == false) {
				return;
			}
			//console.log(tweet.text);

			usersToFollow.push(parseStreamUser(tweet.user));
		} else {
			stream.stop();
			callback(usersToFollow);
		}
	});
}

function checkDifference (user , tweetUser) {
	return Math.floor(tweetUser.friends_count*100/tweetUser.followers_count) >= user.followOnDifference;
}

function parseStreamUser (user) {
	return {
		id: user.id,
		name: user.name,
		screen_name: user.screen_name,
		lang: user.lang.split("-")[0], // if es-MX --> es
		following: user.friends_count,
		followers: user.followers_count
	}
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
	console.log('usersToCheck');
	console.log(usersToCheck);
	userTw.get('friendships/lookup', { user_id: usersToCheck.join() }, function (err, usersChecked){
		if (err) {
			return callback('Error while looking up friendships of: ' + usersToCheck.join());
		}
		var notFollowers = [];
		var followers = [];
		console.log('usersChecked');
		console.log(usersChecked);
		usersChecked.forEach(function (userChecked) {
			if (userChecked.connections.indexOf('followed_by') === -1) {
				console.log('unfollow!');
				notFollowers.push(userChecked.id);
			} else {
				console.log('not unfollow!');
				followers.push(userChecked.id);
			}
				console.log(userChecked);
		});
		callback(null, notFollowers, followers);
	});
}

module.exports = {
	stream: stream,
	checkFollowers: checkFollowers
};