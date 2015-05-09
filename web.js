var Calendar		= require('./calendar'),
	Twitter 		= require('./twitter'),
	Database		= require('./database');

function generateUserCalendar (user) {

	Database.create(function (){
		Database.checkUserCalendar(user, function(err, exists) {
			if (err) {
				console.log(err);
			}
			console.log("already exists: " + exists);
			if (!exists){
				Database.sendCalendar(Calendar.createUserCalendar(user, true), function (err){
					if (err){
						console.log("error on Database.sendCalendar: " + err);
						return;
					}
					Twitter.generateDailyStats(user);
				});
			}
		});
	});
}

module.exports = {
	generateUserCalendar: generateUserCalendar
};