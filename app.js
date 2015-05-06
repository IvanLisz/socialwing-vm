'use strict';

var CronJob 		= require('cron').CronJob,
	Util 			= require('./util'),
	Twitter 		= require('./twitter'),
	Database		= require('./database'),
	TwitterActions	= require('./twitteractions'), //originally require('./lambda/lambda'),
	Calendar		= require('./calendar'),
	express 		= require('express'),
	app 			= express(),
	Web				= require('./web');



app.post('/init', function (req, res) {
	console.log('INIT CALENDAR FROM EC2');
	var userId = Number(req.params.id);
	//res.send(userId);

	Database.getUser (userId, function(err, userData){
		if(err){
			console.log(err);
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
			if (err != 'Tasks already executed') { console.log(err) };
			return;
		}
		Database.getUser(task.user.id, function (err, user){
			if (err){
				console.log(err);
				return;
			}

			if (task.follow) {
				console.log('follow ' + task.follow + ' with ' + task.user.screen_name + ' (' + task.user.id + ')');

				console.log("start streaming");
				console.log(task);
				Twitter.stream(user, task.follow, function (usersToFollow) {
					console.log('finished streaming, users to follow:');

					// follow users
					var followTask = Util.clone(task);
					followTask.follow = Util.getIds(usersToFollow);
					TwitterActions.runTask(user, followTask);
					console.log(followTask);

					// create unfollow task, get rid of the follow and make it unfollow
					delete task.follow;
					task.unfollow = usersToFollow;
					Database.createUnfollowTask(task);

				});
			}

			if (task.unfollow && task.unfollow.length) {
				console.log('check to unfollow');
				console.log(Util.getIds(task.unfollow));
				Twitter.checkFollowers(user, task.unfollow, function (err, notFollowers, followers) {
					if (err) {
						console.log(err);
						return;
					}

					// follow users
					var unfollowTask = Util.clone(task);
					unfollowTask.unfollow = notFollowers;
					TwitterActions.runTask(user, unfollowTask);


					console.log('followers to send message');
					console.log(followers);
					sendMessages(user, followers, task.unfollow);
				});
			}

			if (task.action && task.action.length) {
				console.log("Creando calendario para: " + user.twitter.screen_name + ' (' + user.id + ')');
				Database.sendCalendar(Calendar.createUserCalendar(user), function (err){
					if (err){
						console.log("error on Database.sendCalendar: " + err)
						return;
					}
					Twitter.generateDailyStats(user);
				});
				//Database.sendCalendar(Calendar.createUserCalendar(user));
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

	console.log('*******************run messages');
	console.log(messages);
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
