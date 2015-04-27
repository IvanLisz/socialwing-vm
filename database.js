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

function getOldTasks (callback) {
	if (!calendar) { return callback('database unready'); }
	// Go one day backwards
	var yesterdayMinute = _getNowMinute() - 60000;
	_getTasksByMinutes(yesterdayMinute, callback);
}

function _getTasksByMinutes (minutes, callback) {
	calendar.find({
		timestamp: {
			"$lt" : minutes + 1200010,
			"$gt" : minutes - 1
		}
	}).each(function (err, data) {
		if (err || !data) {
			return callback(err || 'No task founded');
		}
		if (processes.indexOf(data._id.toString()) !== -1) {
			return callback('Tasks already executed');
		}
		processes.push(data._id.toString());
		return callback(null, data);
	});
}

function _getNowMinute () {
	var now = new Date; // now
	now.setSeconds(0); // set seconds to 0
	return Math.floor(now / 1000) * 1000;
}

function updateTask (task) {
	calendar.update(
		{ "_id": task._id },
		task,
		{ upsert: true }
	);
}

function getUser (user, callback) {

	users.findOne({ username: user}, function(err, userdata) {
		if (err || !userdata) {
			return callback(err || "User was not founded.");
		}

		return callback(null, {
			username: user,
			key:  userdata.key,
			secret: userdata.secret,
			track: userdata.track
		});
	});
}

function getUsers (callback) {
	users.find().toArray(function(err, usersData){
		if(err || !usersData){
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

module.exports = {
	create: create,
	getTasks: getTasks,
	getOldTasks: getOldTasks,
	updateTask: updateTask,
	getUser: getUser,
	getUsers: getUsers,
	sendCalendar: sendCalendar
};