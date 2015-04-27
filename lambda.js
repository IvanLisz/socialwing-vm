var lambdaws 	= require('lambdaws'),
	λ 			= lambdaws.create,
	credentials = require('./credentials');

var cloudedTask;

function init () {
	lambdaws.config({
		credentials: {
			accessKey: 'AKIAIVAU7PIVWB534DEA',  // string, AWS AccessKeyId.
			secretKey: '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',  // string, AWS AccessKeySecret.
		},
		role: 'arn:aws:iam::792491017480:role/sqs-lambda', // ** Required **
		region: 'us-west-2'
	});
	cloudedTask = λ('./lambda-task', 'run', ['twit'], { name: 'monk-task', ignoreResponse: true });
}

function runTask (user, task) {
	if (!cloudedTask) {
		console.log('no task in aws lambda');
		return;
	}
	console.log('Task to Lambda of user: ' + user);
	console.log(task);

	var taskCredentials = {
		consumer_key: credentials.APP_TOKEN,
		consumer_secret: credentials.APP_SECRET,
		access_token: user.key,
		access_token_secret: user.secret
	};

	cloudedTask(task, taskCredentials, function(){});
}

init();

module.exports = {
	runTask: runTask
};