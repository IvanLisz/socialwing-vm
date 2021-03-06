'use strict';

var CronJob 		= require('cron').CronJob,
	Util 			= require('./util'),
	Twitter 		= require('./twitter'),
	Database		= require('./database'),
	TwitterActions	= require('./twitteractions'), //originally require('./lambda/lambda'),
	Calendar		= require('./calendar'),
	express 		= require('express'),
	app 			= express(),
	Web				= require('./web'),
	Logs			= require('./logs');



app.get('/init', function (req, res) {
	var userId = req.query.id;
	Database.getUserById (userId, function(err, userData){
		if(err){
			//console.log(err);
			Logs.webErr(err);
			return;
		}
		console.log(userData);
		Web.generateUserCalendar(userData);
	});


	res.sendStatus(200);
});

var server = app.listen(9100, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});


function getTasks () {

	Database.getTasks(function (err, task) {
		if (err){
			if (err != 'Tasks already executed' && err != 'No task founded') {
				//console.log(err);
				Logs.databaseErr(err);
			};
			return;
		}
		Database.getUser(task.user.id, function (err, user){
			if (err){
				//console.log(err);
				Logs.databaseErr(err);
				return;
			}

			if (task.follow) {
				Twitter.stream(user, task.follow, function (usersToFollow) {
					if (!usersToFollow || !usersToFollow.length){
						//console.log("****No users to follow****");
						return;
					}
					// follow users
					var followTask = Util.clone(task);
					followTask.follow = Util.getIds(usersToFollow);
					TwitterActions.runTask(user, followTask);

					// create unfollow task, get rid of the follow and make it unfollow
					delete task.follow;
					task.unfollow = usersToFollow;
					Database.createUnfollowTask(task);

				});
			}

			if (task.unfollow && task.unfollow.length) {
				Twitter.checkFollowers(user, task.unfollow, function (err, notFollowers, followers) {
					if (err) {
						//console.log(err);
						Logs.twitterErr(err);
						return;
					}

					if (notFollowers && notFollowers.length){
						// follow users
						var unfollowTask = Util.clone(task);
						unfollowTask.unfollow = notFollowers;
						TwitterActions.runTask(user, unfollowTask);
					}

					if (followers && followers.length){
						sendMessages(user, followers, task.unfollow);
					}

				});
			}

			if (task.action && task.action.length) {
				Database.sendCalendar(Calendar.createUserCalendar(user), function (err){
					if (err){
						//console.log("error on Database.sendCalendar: " + err)
						Logs.databaseErr(err);
						return;
					}
					Twitter.generateDailyStats(user);
				});
			}

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

	if (!user.settings.messages) {
		return;
	}

	followers.forEach(function (followerId) {
		followData.forEach(function (followerData){
			if (followerId === followerData.id) {
				messages.push({
					id: followerData.id,
					message: Util.removeDiacritics(getMessage(followerData, user.settings.messages[followerData.lang] ||
							 user.settings.messages.es ||
							 user.settings.messages.en ||
							 user.settings.messages[Object.keys(user.settings.messages)[0]]))
				});
			}
		});
	});

	// message followers
	TwitterActions.runMessages(user, messages);
}

function getMessage (followerData, messages) {
	var msg = messages[Util.randomInt(0, messages.length -1)]
			.replace("%usuario", followerData.screen_name)
			.replace("%nombre_completo", followerData.name)
			.replace("%nombre", followerData.name.split(' ')[0] || followerData.name.toLowerCase())
			.replace("%apellido", followerData.name.split(' ')[1] || followerData.name.toLowerCase());
	return msg;
}
