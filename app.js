'use strict';

var CronJob 		= require('cron').CronJob,
	Util 			= require('./util'),
	Twitter 		= require('./twitter'),
	Database		= require('./database'),
	Lambda			= require('./lambda'),
	Calendar		= require('./calendar'),
	lastCalendar	= null;

function _getIds (users) {
	return users.map(function(user){
		return user.id;
	});
}

function getTasks () {
	var time = new Date();
	if (time.getHours() === 0 &&  time.getMinutes() === 0 && lastCalendar != time.getDay()) {
		console.log("Creando calendario");
		Calendar.create();
		lastCalendar = time.getDay();
	}

	Database.getTasks(function (err, task) {
		if (err){
			if (err != 'Tasks already executed') { console.log(err) };
			return;
		}
		Database.getUser(task.user.id, function (err, user){
			if (err){
				console.log(err);
				return;
			}
			console.log('follow ' + task.follow + ' with ' + task.user.screen_name + ' (' + task.user.id + ')');

			if (task.follow) {
				console.log("start streaming");
				console.log(task);
				Twitter.stream(user, task.follow, function (usersToFollow) {
					console.log('finished streaming, users to follow:');

					// follow users
					var followTask = Util.clone(task);
					followTask.follow = _getIds(usersToFollow);
					Lambda.runTask(user, followTask);
					console.log(followTask);

					// create unfollow task, get rid of the follow and make it unfollow
					delete task.follow;
					task.unfollow = usersToFollow;
					Database.createUnfollowTask(task);

				});
			}

			if (task.unfollow && task.unfollow.length) {
				console.log('check to unfollow');
				console.log(_getIds(task.unfollow));
				Twitter.checkFollowers(user, _getIds(task.unfollow), function (err, notFollowers, followers) {
					if (err) {
						console.log(err);
						return;
					}

					// follow users
					var unfollowTask = Util.clone(task);
					unfollowTask.unfollow = notFollowers;
					Lambda.runTask(user, unfollowTask);


					console.log('followers to send message');
					console.log(followers);
					sendMessages(user, followers, task.unfollow);
					Database.deleteTask(task);
				});
			}

		});
	});
}

Database.create(function(){
	new CronJob({
		cronTime: '* * * * * *',
		onTick: getTasks,
		start: true
	});
});



function sendMessages (user, followers, followData) {

	var messages = [];

	followers.forEach(function (followerId) {
		followData.forEach(function (followerData){
			if (followerId === followerData.id) {
				messages.push({
					id: followerData.id,
					message: getMessage(followerData, user.settings.messages[followerData.lang] ||
							 user.settings.messages.es ||
							 user.settings.messages.en ||
							 user.settings.messages[Object.keys(user.settings.messages)[0]])
				});
			}
		});
	});

	console.log('*******************run messages');
	console.log(messages);
	// message followers
	Lambda.runMessages(user, messages);
}

function getMessage (followerData, messages) {
	var msg = messages[Util.randomInt(0, messages.length -1)]
			.replace("%screen_name", followerData.screen_name)
			.replace("%full_name", followerData.name)
			.replace("%first_name", followerData.name.split(' ')[0] || followerData.name)
			.replace("%last_name", followerData.name.split(' ')[1] || followerData.name);
	return msg;
}
