var MongoClient 	= require('mongodb').MongoClient;

var calendar;
var users;
var processes = [];
var DB;

function create (callback) {
	// Connection URL
	var url = 'mongodb://localhost:27017/monk';
	MongoClient.connect(url, function(err, db) {
		DB = db;
		calendar = db.collection('calendar');
		users = db.collection('users');
		callback();
	});
}

function getTasks (callback) {
	if (!calendar) { return callback('database unready'); }
	var nowMinute = _getNowMinute();
	_getTasksByMinutes(nowMinute, callback);
}

function _getTasksByMinutes (minutes, callback) {

	console.log('******************');
	console.log('lower than');
	console.log(minutes + 60000);
	console.log('greater than than');
	console.log(minutes - 1);

	calendar.find({
		timestamp: {
			"$lt" : minutes + 60001,
			"$gt" : minutes - 1
		}
	}).each(function (err, data) {
		if (err || !data) {
			return callback(err || 'No task founded');
		}
		calendar.remove({ "_id": data._id });
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
	task.timestamp = Date.now() + 7200000;
	calendar.insert(task);
}

function getUser (id, callback) {

	users.findOne({ 'twitter.id': id }, function(err, userdata) {
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

function sendCalendar (userCalendar) {
	// Remove the tasks scheduled 2 days ago
	calendar.remove({
		timestamp: {
			"$lt" : Date.now - (86400000 * 2)
		}
	});
	// Insert new calendar
	calendar.insert(userCalendar);
}


function addUserStats (user, userData) {
	if (!user.metrics.stats) {
		user.metrics.stats = [];
	}
	user.metrics.stats.push({
		followers: userData.followers_count,
		following: userData.friends_count,
		timestamp: Date.now()
	});

	users.update({ _id: user._id }, user);
}

function deleteTask (task) {
	calendar.remove({ "_id": task._id });
}

module.exports = {
	create: create,
	getTasks: getTasks,
	createUnfollowTask: createUnfollowTask,
	getUser: getUser,
	getUsers: getUsers,
	sendCalendar: sendCalendar,
	addUserStats: addUserStats,
	deleteTask: deleteTask
};