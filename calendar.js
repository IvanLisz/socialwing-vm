var Twitter 		= require('./twitter'),
	Database		= require('./database');

function getMinutes () {
	var minuteTMP = [];

	var count = 0;
	var valid = true;
	var dayMinutes = 1440;

	var timeStamp = Date.now();

	while(valid) {

		var NextFollow = randomInt(5, 50);
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

function fillWithFollow (calendar) {
	var FollowLimit = 1000;//randomInt(900,1000);
	var FollowHour = Math.floor(FollowLimit/calendar.length);

	var FollowToday = 0;

	calendar.forEach(function (action){
		var IncrementF = randomInt(0,7);
		var PassedLimit = (FollowToday + FollowHour + IncrementF) >= FollowLimit;

		if(randomInt(0,1) == 0 || PassedLimit){
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

function fillWithUser (calendar, user) {
	calendar.map(function (action){
		action.user = user;
	});
}

function createCalendar (users, callback) {


	var usersCalendar = [];
	users.forEach(function (user) {
		var calendar = getMinutes();
		fillWithFollow(calendar);
		fillWithUser(calendar, user.username);
		usersCalendar = usersCalendar.concat(calendar);
		Twitter.generateUserStats(user);
	});

	return callback(usersCalendar);
}

function randomInt (min,max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

function create () {
	Database.create(function(){
		Database.getUsers(function(err, users){
			if (err){
				console.log("err");
				console.log(err);
				return;
			}
			createCalendar(users, function(calendar){
				Database.sendCalendar(calendar);
			});
		});
	});
}

module.exports = {
	create: create
}

if (process.argv[2] == 'create') { create(); }