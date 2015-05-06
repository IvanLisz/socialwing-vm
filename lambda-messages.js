//var Twit 		= require('twit'),
//	userTw;

function run (messages, credentials, callback) {
	console.log("hola");
	//userTw = new Twit(credentials);
	//sendMessages(messages, 0, callback);
}

function sendMessages (messages, index, callback) {
	if (!messages || index >= messages.length) {
		callback();
		return;
	}

	userTw.post('direct_messages/new', { user_id: messages[index].id, text: messages[index].message }, function (err, reply) {
		if (err) {
			console.log('err');
			console.log(err);
		}
		sendMessages(messages, index + 1, callback);
	});

}

module.exports = {
	run: run
}
