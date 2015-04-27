var Twit 		= require('twit'),
	userTw;

function run (task, credentials, callback) {
	console.log('task');
	console.log(task);
	console.log('credentials');
	console.log(credentials);
	userTw = new Twit(credentials);
	editFriendship('create', task.follow, 0, callback);
	editFriendship('destroy', task.unfollow, 0, callback);
}

function editFriendship (friendship, users, index, callback) {
	if (!users || index >= users.length) {
		callback();
		return;
	}

	userTw.post('friendships/' + friendships, { id: users[index] }, function (err, reply){
		if (err) {
			console.log('Error:');
			console.log(err);
		}
		followUsers(friendship, users, index + 1, callback);
	});
}

module.exports = {
	run: run
}
