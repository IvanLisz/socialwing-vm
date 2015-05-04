Calendar		= require('./calendar'),
Database		= require('./database');

function generateUserCalendar(user){

	Database.create(function (){
		Database.sendCalendar(Calendar.createUserCalendar(user));
		Database.close();
	});
}

module.exports = {
	generateUserCalendar: generateUserCalendar
}