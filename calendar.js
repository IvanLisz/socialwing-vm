var Twitter 		= require('./twitter'),
	Database		= require('./database'),
	Util 			= require('./util');

function getMinutes () {
	var minuteTMP = [];

	var count = 0;
	var valid = true;
	var dayMinutes = 1440;

	var timeStamp = Date.now();

	while(valid) {

		var NextFollow = Util.randomInt(5, 50);
		var PassedLimit = NextFollow + count >= dayMinutes;

		if (PassedLimit == false) {
			count = count + NextFollow;
			minuteTMP.push({ timestamp: timeStamp + count * 60000 });
		} else {
			valid = false;
		}
	}

	return minuteTMP;
}

function _fillWithFollow (calendar) {
	var FollowLimit = 1000;//Util.randomInt(900,1000);
	var FollowHour = Math.floor(FollowLimit/calendar.length);

	var FollowToday = 0;

	calendar.forEach(function (action){
		var IncrementF = Util.randomInt(0,7);
		var PassedLimit = (FollowToday + FollowHour + IncrementF) >= FollowLimit;

		if(Util.randomInt(0,1) == 0 || PassedLimit){
			if(PassedLimit){
				var FHour = 0;
			} else {
				var FHour = FollowHour - IncrementF;
			}

		}else{
			var FHour = FollowHour + IncrementF;
		}
		action.follow = FHour;
		FollowToday = FollowToday + FHour;
	});
}

function _fillWithUser (calendar, user) {
	calendar.map(function (action){
		action.user = user;
	});
}

function _createCalendar (users, callback) {


	var usersCalendar = [];
	users.forEach(function (user) {
		var calendar = getMinutes();
		_fillWithFollow(calendar);
		_fillWithUser(calendar, user.username);
		usersCalendar = usersCalendar.concat(calendar);
		Twitter.generateUserStats(user);
	});

	return callback(usersCalendar);
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
	create: create
}

if (process.argv[2] == 'create') { create(); }