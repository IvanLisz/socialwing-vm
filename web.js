Calendar		= require('./calendar'),
Database		= require('./database');

function generateUserCalendar(){

	Database.create(function (){
		var user = {
			twitter: {
				screen_name: "TuMama",
				id: 100
			}
		};

		console.log(user);
		Database.sendCalendar(Calendar.createUserCalendar(user));

		Database.close();
	});
}

generateUserCalendar();


module.exports = {
	generateUserCalendar: generateUserCalendar
}