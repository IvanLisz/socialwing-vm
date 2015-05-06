var credentials = require('./credentials'),
	Twit 		= require('twit');

function runTask (user, task) {
	if (!user || !task) {
		console.log('No user or task');
		return;
	}
	console.log('Follow/unFollow Task of user: ' + user.twitter.screen_name);

	var taskCredentials = {
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	};

	userTw = new Twit(taskCredentials);
	_editFriendship('create', task.follow, 0, function(){
		_editFriendship('destroy', task.unfollow, 0, function(){});
	});
}


function runMessages (user, messages) {
	if (!user || !messages) {
		console.log('no user or messages');
		return;
	}
	console.log('Message Task of user: ' + user.twitter.screen_name);

	var taskCredentials = {
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	};

	userTw = new Twit(taskCredentials);
	_sendMessages(messages, 0, function(){});
}





function _sendMessages (messages, index, callback) {
	if (!messages || index >= messages.length) {
		callback();
		return;
	}

	userTw.post('direct_messages/new', { user_id: messages[index].id, text: messages[index].message }, function (err, reply) {
		if (err) {
			console.log('err');
			console.log(err);
		}
		_sendMessages(messages, index + 1, callback);
	});

}


function _editFriendship (friendship, users, index, callback) {
	if (!users || index >= users.length) {
		callback();
		return;
	}

	userTw.post('friendships/' + friendship, { id: users[index] }, function (err, reply) {
		if (err) {
			console.log('err');
			console.log(err);
		}
		//console.log(friendship + ' ' + users[index]);
		_editFriendship(friendship, users, index + 1, callback);
	});
}

module.exports = {
	runTask: runTask,
	runMessages: runMessages
}
