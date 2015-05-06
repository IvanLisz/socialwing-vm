var Twit 		= require('twit'),
	userTw;

function run (task, credentials, callback) {

	console.log('task');
	console.log(task);
	console.log('credentials');
	console.log(credentials);

	userTw = new Twit(credentials);
	editFriendship('create', task.follow, 0, function(){
		editFriendship('destroy', task.unfollow, 0, callback);
	});
}

function editFriendship (friendship, users, index, callback) {
	if (!users || index >= users.length) {
		callback();
		return;
	}

	userTw.post('friendships/' + friendship, { id: users[index] }, function (err, reply) {
		if (err) {
			console.log('err');
			console.log(err);
		}
		console.log(friendship + ' ' + users[index]);
		editFriendship(friendship, users, index + 1, callback);
	});
}

module.exports = {
	run: run
}
