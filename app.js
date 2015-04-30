'use strict';

var CronJob 		= require('cron').CronJob,
	Twitter 		= require('./twitter'),
	Database		= require('./database'),
	Lambda			= require('./lambda'),
	Calendar		= require('./calendar'),
	lastCalendar	= null;

function getIds (users) {
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
		Database.getUser(task.user, function (err, user){
			console.log('follow ' + task.follow + ' with ' + task.user);
			Twitter.stream(user, task.follow, function (usersToFollow) {
				console.log('finished streaming, users to follow:');
				console.log(getIds(usersToFollow));

				task.follow = usersToFollow;

				Database.updateTask(task);

				task.follow = getIds(usersToFollow); //aguante el pako
				Lambda.runTask(user, task);
			});
		});
	});

		console.log('getting old tasks...');
	Database.getOldTasks(function (err, task) {
		console.log('old tasks...');
		console.log(task);
		if (err){
			if (err != 'Tasks already executed') { console.log(err) };
			return;
		}
		if (typeof task !== 'object') {
			return console.log('Task to unfollow ' + task + ' is not an object.');
		}
		console.log('getted old task');
		Database.getUser(task.user, function (err, user){
			console.log('check to unfollow');
			console.log(getIds(task.follow));
			Twitter.checkFollowers(user, getIds(task.follow), function (err, notFollowers, followers) {
				if (err) {
					console.log(err);
					return;
				}
				console.log('unfollow checked:');
				console.log(notFollowers);
				// unfollow who doesn't return follow
				var followData = task.follow;
				task.unfollow = notFollowers;
				delete task.follow;
				console.log('*******************unfollow task');
				console.log(task);
				Lambda.runTask(user, task);

				sendMessages(user, followers, followData);
			});
		});
	});
}

Database.create(function(){
	new CronJob({
		cronTime: '0 * * * * *',
		onTick: getTasks,
		start: true
	});
});



function sendMessages (user, followers, followData) {
	var messages = [];
	followers.forEach(function (followerId) {

		var followerData = getFollowerData(followData, followerId);
		messages.push({
			id: followerData.id,
			message: getMessage(followerData, user.messages[followerData.lang] ||
					 user.messages.es ||
					 user.messages.en ||
					 user.messages[Object.keys(user.messages)[0]])
		})
	});
	// message followers
	Lambda.runMessages(user, messages);
}

function getFollowerData (followers, id) {
	var data;
	followers.forEach(function (follower){
		if (follower.id === id){
			data = follower;
		}
	});
	return data;
}

function getMessage (followerData, messages) {
	var msg = messages[randomInt(0, messages.length -1)]
			.replace("%screen_name", followerData.screen_name)
			.replace("%full_name", followerData.name)
			.replace("%first_name", followerData.name.split(' ')[0] || followerData.name)
			.replace("%last_name", followerData.name.split(' ')[1] || followerData.name);
	return msg;
}

function randomInt (min,max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}