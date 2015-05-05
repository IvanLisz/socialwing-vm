Calendar		= require('./calendar'),
Database		= require('./database');

function generateUserCalendar (user) {

	Database.create(function (){
		Database.checkUserCalendar(user, function(err, exists) {
			if (err) {
				console.log(err);
			}
			console.log("already exists: " + exists);
			if (!exists){
				Database.sendCalendar(Calendar.createUserCalendar(user, true));
			}
		});
	});
}

module.exports = {
	generateUserCalendar: generateUserCalendar
}