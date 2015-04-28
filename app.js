'use strict';

var CronJob 		= require('cron').CronJob,
	Twitter 		= require('./twitter'),
	Database		= require('./database'),
	Lambda			= require('./lambda'),
	Calendar		= require('./calendar'),
	lastCalendar	= null;

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
				task.follow = usersToFollow;
				Database.updateTask(task);
				Lambda.runTask(user, task);
			});
		});
	});
	Database.getOldTasks(function (err, task) {
		if (err){
			if (err != 'Tasks already executed') { console.log(err) };
			return;
		}
		console.log('getted old task');
		Database.getUser(task.user, function (err, user){
			console.log('check to unfollow');
			console.log(task.follow);
			Twitter.checkFollowers(user, task.follow, function (err, notFollowers) {
				if (err) {
					console.log(err);
					return;
				}
				console.log('unfollowers');
				console.log(notFollowers);
				task.unfollow = notFollowers;
				delete task.follow;
				console.log('task');
				console.log(task);
				Lambda.runTask(user, task);
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

