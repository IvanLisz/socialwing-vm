var Twit 		= require('twit'),
	userTw;

function run (task, credentials, callback) {
	console.log('task');
	console.log(task);
	console.log('credentials');
	console.log(credentials);
	userTw = new Twit(credentials);
	console.log('1');
	editFriendship('create', task.follow, 0, function(){
		console.log('2');
		editFriendship('destroy', task.unfollow, 0, callback);
	});
}

function editFriendship (friendship, users, index, callback) {
	if (!users || index >= users.length) {
		console.log('3');
		callback();
		return;
	}
	console.log('wtf');
	console.log(friendship);
	console.log(users[index]);
	console.log(callback);
	console.log('4');

	userTw.post('friendships/' + friendship, { id: users[index] }, function (err, reply) {
		console.log('5');
		if (err) {
			console.log('6');
			console.log('Error:');
			console.log(err);
		}
		console.log('Reply:');
		console.log(reply);
		editFriendship(friendship, users, index + 1, callback);
	});
}

module.exports = {
	run: run
}
