var MongoClient = require('mongodb').MongoClient;

var calendar;
var users;
var processes = [];
var DB;

function create (callback) {

	if (!DB) {
		// Connection URL
		var url = 'mongodb://localhost:27017/monk';
		MongoClient.connect(url, function(err, db) {
			DB = db;
			calendar = db.collection('calendar');
			users = db.collection('users');
			callback();
		});
	}else{
		console.log("DB ALREADY OPENED");
		callback();
	}
}


function close(){
	DB.close();
}

function getTasks (callback) {
	if (!calendar) { return callback('database unready'); }
	var nowMinute = _getNowMinute();
	_getTasksByMinutes(nowMinute, callback);
}

function _getTasksByMinutes (minutes, callback) {

	calendar.find({
		timestamp: {
			"$lt" : minutes + 60001,
			"$gt" : minutes - 1
		}
	}).each(function (err, data) {
		if (err || !data) {
			return callback(err || 'No task founded');
		}
		deleteTask(data);
		return callback(null, data);
	});
}

function _getNowMinute () {
	var now = new Date; // now
	now.setSeconds(0); // set seconds to 0
	now.setMilliseconds(0); // set miliseconds to 0
	return now.getTime();
}

function createUnfollowTask (task) {
	if (task.unfollow && task.unfollow.length){
		task.timestamp = Date.now() + 7200000;
		calendar.insert(task);
	}
}

function getUser (id, callback) {

	users.findOne({ 'id': id }, function(err, userdata) {
		if (err || !userdata) {
			return callback(err || 'UserID ('+ id + ') was not founded.');
		}

		return callback(null, userdata);
	});
}

function getUsers (callback) {
	users.find().toArray(function(err, usersData){
		if(err || !usersData.length) {
			return callback(err || "No users where founded");
		}
		return callback(null, usersData);
	});
}

function sendCalendar (userCalendar, callback) {
	// Insert new calendar
	console.log(userCalendar);
	calendar.insert(userCalendar.calendar, function (err, response){
		if (err){
			return callback(err);
		}
		return callback(null, userCalendar.user)
	});
}


function saveDailyStats (user, twitterUserData) {

	console.log('before');
	console.log(user.metrics.stats);
	if (!user.metrics.stats) {
		user.metrics.stats = [];
	}
	user.metrics.stats.push({
		followers: twitterUserData.followers_count,
		following: twitterUserData.friends_count,
		timestamp: Date.now()
	});

	console.log('after');
	console.log(user.metrics.stats);
	console.log('user._id');
	console.log(user._id);
	updateUser(user);
}

function saveMetrics(user, newMetrics){

	console.log(newMetrics);

	if(!newMetrics || !user) {
		return;
	}

	Object.keys(newMetrics).forEach(function (property){
		user.metrics[property] = user.metrics[property] + newMetrics[property];
	});


	//users.update({ _id: user._id }, user);
	updateUser(user);
}

function updateUser(user, callback) {
	delete user._id;
	users.update({ id: user.id }, user, callback);
}

function deleteTask (task) {
	calendar.remove({ "_id": task._id });
}


function checkUserCalendar (userData, callback) {
	calendar.findOne({ 'user.id': userData.id }, function(err, data) {
		if (err || !data){
			return callback(err, false);
		}
		return callback(null, true);
	});
}

module.exports = {
	create: create,
	close: close,
	getTasks: getTasks,
	createUnfollowTask: createUnfollowTask,
	getUser: getUser,
	getUsers: getUsers,
	sendCalendar: sendCalendar,
	saveDailyStats: saveDailyStats,
	deleteTask: deleteTask,
	saveMetrics: saveMetrics,
	checkUserCalendar: checkUserCalendar
};