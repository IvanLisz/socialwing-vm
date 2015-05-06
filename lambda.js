var lambdaws 	= require('lambdaws'),
	λ 			= lambdaws.create,
	credentials = require('./credentials');

var cloudedTask;
var cloudedMessages;

function init () {
	lambdaws.config({
		credentials: {
			accessKey: 'AKIAIVAU7PIVWB534DEA',  // string, AWS AccessKeyId.
			secretKey: '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',  // string, AWS AccessKeySecret.
		},
		role: 'arn:aws:iam::792491017480:role/sqs-lambda', // ** Required **
		region: 'us-west-2',
		uploadTimeout: 120000
	});
	cloudedTask = λ('./lambda-task', 'run', ['twit'], { name: 'monk-task', ignoreResponse: true, timeout: 30 });
	cloudedMessages = λ('./lambda-messages', 'run', ['twit'], { name: 'monk-msgs', ignoreResponse: true, timeout: 30 });
}

function runTask (user, task) {
	if (!cloudedTask) {
		console.log('no task in aws lambda');
		return;
	}
	console.log('Task to Lambda of user: ' + user.twitter.screen_name);
	console.log(task);

	var taskCredentials = {
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	};

	cloudedTask(task, taskCredentials, function(){});
}


function runMessages (user, messages) {
	if (!cloudedMessages) {
		console.log('no task in aws lambda');
		return;
	}
	console.log('Task to Lambda of user: ' + user.twitter.screen_name);

	var taskCredentials = {
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.token,
		access_token_secret: user.tokenSecret
	};

	cloudedMessages(messages, taskCredentials, function(){});
}


init();

module.exports = {
	runTask: runTask,
	runMessages: runMessages
};