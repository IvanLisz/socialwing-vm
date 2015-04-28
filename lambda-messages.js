var Twit 		= require('twit'),
	userTw;

function run (messages, credentials, callback) {
	console.log('messages');
	console.log(messages);
	console.log('credentials');
	console.log(credentials);
	userTw = new Twit(credentials);
	console.log('1');
	sendMessages(messages, 0, callback);
}

function sendMessages (messages, index, callback) {
	if (!messages || index >= messages.length) {
		console.log('3');
		callback();
		return;
	}
	console.log('wtf');
	console.log(messages);
	console.log(messages[index]);
	console.log('4');

	userTw.post('direct_messages/new', { user_id: messages[index].id, text: messages[index].message }, function (err, reply) {
		console.log('5');
		if (err) {
			console.log('6');
			console.log('Error:');
			console.log(err);
		}
		console.log('Reply:');
		console.log(reply);
		sendMessages(messages, index + 1, callback);
	});

}

module.exports = {
	run: run
}
