var Twit 		= require('twit'),
	credentials = require('./credentials'),
	Database		= require('./database');

function stream (user, limit, callback) {

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	});

	var StartStream = Date.now();

	console.log("INSIDE STREAM");

	var stream = userTw.stream('statuses/filter',  { track: user.settings.track.join(), language: user.settings.trackLangs.join() });
	var usersToFollow = [];
	stream.on('tweet', function (tweet) {
		var streamTimeOut = (Date.now() - StartStream) < 2000; //pasaron menos de 15 Segundos?
		if (usersToFollow.length < limit &&  streamTimeOut) {
			if (usersToFollow.map(function (uData){ return uData.id }).indexOf(tweet.user.id) >=  0 || !_checkDifference(user, tweet.user, 'followOnDifference') || !_filterUser(tweet)) {
				return;
			}
			//console.log(tweet.text);
			usersToFollow.push(_parseStreamUser(tweet.user));
		} else {
			stream.stop();

			if(streamTimeOut == false){
				console.log("*****************WARNING: STREAMING TIMEOUT");
				//TODO: SEND NOTIFICATION TO USER
			}else{
				console.log("*****************STREAMING TIME:")
				console.log(Date.now() - StartStream);
			}

			callback(usersToFollow);
		}
	});
}


function _filterUser (tweet) {
	var permited = true;
	var BlackList = ['+18', 'porn', 'sex', 'gay', 'lesbian', 'xxx', 'calient', 'puta', 'puto', 'cunt', 'fuck', 'milf'];

	checkOnBlackList(tweet.text);
	['name', 'screen_name', 'description'].forEach(function (property) {
		checkOnBlackList(tweet.user[property]);
	});

	function checkOnBlackList (data) {
		BlackList.forEach(function (word){
			if (data.indexOf(word) !== -1){
				return permited = false;
			}
		});

	}

	return permited;
}


function checkFollowers (user, usersToCheck, callback) {

	if (usersToCheck.constructor !== Array) {
		return callback('Need usersToCheck to be an array');
	}

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
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
			if (userChecked.connections.indexOf('followed_by') === -1 || _checkDifference(user, userChecked, 'unfollowOnDifference')) {
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

function generateUserStats (user) {
	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	});

	userTw.get('users/show', { id: user.twitter.id }, function (err, userData){
		if (err) {
			console.log('Error while looking up status of' + user.twitter.screen_name + ' (' + user.twitter.id + ')');
			return;
		}

		Database.addUserStats(user, userData);
	});
}

function _checkDifference (user , tweetUser, difference) {
	return Math.floor(tweetUser.friends_count*100/tweetUser.followers_count) >= user.settings[difference];
}

function _parseStreamUser (user) {
	return {
		id: user.id,
		name: user.name,
		screen_name: user.screen_name,
		lang: user.lang.split("-")[0], // if es-MX --> es
		following: user.friends_count,
		followers: user.followers_count
	}
}

module.exports = {
	stream: stream,
	checkFollowers: checkFollowers,
	generateUserStats: generateUserStats
};