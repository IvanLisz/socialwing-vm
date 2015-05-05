var Twitter 		= require('./twitter'),
	Database		= require('./database'),
	Util 			= require('./util');

function getMinutes (firstCalendar) {
	var minuteTMP = [];

	var count = 0;
	var valid = true;
	var dayMinutes = 1440;

	var timeStamp = Date.now();

	while(valid) {
		var NextFollow = Util.randomInt(5, 50);
		var PassedLimit = NextFollow + count >= dayMinutes;

		if (PassedLimit == false) {
			if (firstCalendar && count == 0) {
				count = count + 1;
				minuteTMP.push({ timestamp: timeStamp });
			} else {
				count = count + NextFollow;
				minuteTMP.push({ timestamp: timeStamp + count * 60000 });
			}
		} else {
			valid = false;
		}
	}

	return minuteTMP;
}

function _fillWithFollow (calendar, firstCalendar) {
	var FollowLimit = Util.randomInt(900,1000);
	var FollowHour = Math.floor(FollowLimit/calendar.length);

	var FollowToday = 0;

	calendar.forEach(function (action) {
		var IncrementF = Util.randomInt(0,7);
		var PassedLimit = (FollowToday + FollowHour + IncrementF) >= FollowLimit;

		if(firstCalendar && FollowToday == 0){
			FHour = Util.randomInt(35,45);
		}else{
			if(Util.randomInt(0,1) == 0 || PassedLimit){
				if(PassedLimit){
					var FHour = 0;
				} else {
					var FHour = FollowHour - IncrementF;
				}

			}else{
				var FHour = FollowHour + IncrementF;
			}
		}
		action.follow = FHour;
		FollowToday = FollowToday + FHour;
	});
}

function _fillWithUser (calendar, uid, user) {
	calendar.map(function (action){
		action.user = {
			screen_name: user,
			id: uid,
		}
	});
}


function _generateNewCalendarTask(calendar) {
	calendar.push({
		timestamp: Date.now() + 86400000,
		action: "createCalendar"
	})
}

function _createCalendar (users, callback) {


	var usersCalendar = [];
	users.forEach(function (user) {

		usersCalendar = usersCalendar.concat(createUserCalendar(user));

	});

	return callback(usersCalendar);
}



function createUserCalendar (user, firstCalendar) {
	console.log('crete user calendar');
	var calendar = getMinutes(firstCalendar);
	_fillWithFollow(calendar, firstCalendar);
	_generateNewCalendarTask(calendar);
	_fillWithUser(calendar, user.twitter.id, user.twitter.screen_name);
	//Twitter.generateDailyStats(user);
	return calendar;

}


function create () {
	Database.create(function(){
		Database.getUsers(function(err, users){
			if (err){
				console.log("err");
				console.log(err);
				return;
			}
			_createCalendar(users, function(calendar){
				Database.sendCalendar(calendar);
			});
		});
	});
}

module.exports = {
	create: create,
	createUserCalendar: createUserCalendar
}


/*Database.create(function(){
	var user = { twitter: { id: 1, screen_name: "peron" } };
	Database.sendCalendar(createUserCalendar(user));
});
*/