var Twit 		= require('twit'),
	credentials = require('./credentials'),
	Util 			= require('./util'),
	Database		= require('./database');

//	console.log('JSON.stringify(Database)');
//	console.log(JSON.stringify(Database));
//	console.log(Database);

function stream (user, limit, callback) {

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	});

	var StartStream = Date.now();

	console.log("INSIDE STREAM");

	if(!user.settings.track || !user.settings.trackLangs || !user.settings.trackLangs.length || !user.settings.track.length){
		console.log('user: ' +  user.twitter.screen_name + " does not have track or tracklangs");
		callback();
		return;
	}

	var stream = userTw.stream('statuses/filter',  { track: user.settings.track.join(), language: user.settings.trackLangs.join() });
	var usersToFollow = [];
	stream.on('tweet', function (tweet) {
		var streamTimeOut = (Date.now() - StartStream) < 60000; //pasaron menos de 1 Minuto?
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
			}
			console.log("*****************STREAMING TIME:")
			console.log(Date.now() - StartStream);

			Database.saveMetrics(user, { peopleReached: usersToFollow.length });
			return callback(usersToFollow);
		}
	});
}


function _filterUser (tweet) {
	var permited = true;
	var BlackList = ['+18', 'porn', 'sex', 'gay', 'lesbian', 'xxx', 'calient', 'puta', 'puto', 'cunt', 'fuck', 'milf', 'Pics', 'hot', 'chicks'];

	checkOnBlackList(tweet.text);
	['name', 'screen_name', 'description'].forEach(function (property) {
		checkOnBlackList(tweet.user[property]);
	});

	function checkOnBlackList (data) {
		BlackList.forEach(function (word){
			if (data && data.indexOf(word) !== -1){
				return permited = false;
			}
		});

	}

	return permited;
}


function checkFollowers (user, unfollow, callback) {

	usersToCheck = Util.getIds(unfollow);
	if (usersToCheck.constructor !== Array) {
		return callback('Need usersToCheck to be an array');
	}

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	});
	userTw.get('friendships/lookup', { user_id: usersToCheck.join() }, function (err, usersChecked){
		if (err) {
			return callback('Error while looking up friendships of: ' + usersToCheck.join());
		}
		var notFollowers = [];
		var followers = [];
		var newFollowers = 0;

		usersChecked.forEach(function (userChecked, index) {
			if (userChecked.connections.indexOf('followed_by') > -1) { //if user is following back
				if (_checkDifference(user, unfollow[index], 'unfollowOnDifference')) {
					console.log("unfollow! -- unfollowOnDifference")
					notFollowers.push(userChecked.id);
				} else {
					console.log('continue following!');
					followers.push(userChecked.id);
				}
				newFollowers++;
			} else if(userChecked.connections.indexOf('following') > -1) {
				console.log('unfollow!');
				notFollowers.push(userChecked.id);
			}
		});

		Database.saveMetrics(user, { newFollowers: newFollowers });
		callback(null, notFollowers, followers);
	});
}

function generateDailyStats (user, callback) {

	console.log("GENERATE DAILY STATS");

	var userTw = new Twit({
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	});

	console.log('user.id');
	console.log(user.id);

	userTw.get('users/show', { id: user.id }, function (err, twitterUserData){
		if (err) {
			console.log('Error while looking up status of: ' + user.twitter.screen_name + ' (' + user.id + ')');
			return;
		}
		//return callback(null,twitterUserData);
		//console.log(JSON.stringify(Database));
		Database.saveDailyStats(user, twitterUserData);
	});


}

function _checkDifference (user , tweetUser, difference) {
	if (!user.settings[difference]){
		if (difference == "unfollowOnDifference"){
			return false;
		} else if (difference == "followOnDifference") {
			return true;
		}
	}else {
		return Math.floor(tweetUser.friends_count*100/tweetUser.followers_count) >= user.settings[difference];
	}
}

function _parseStreamUser (user) {
	return {
		id: user.id,
		name: user.name,
		screen_name: user.screen_name,
		lang: user.lang.split("-")[0], // if es-MX --> es
		friends_count: user.friends_count,
		followers_count: user.followers_count
	}
}

module.exports = {
	stream: stream,
	checkFollowers: checkFollowers,
	generateDailyStats: generateDailyStats
};