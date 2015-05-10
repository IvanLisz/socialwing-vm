var fs = require('fs');

function twitterErr (errMsg){
	_saveData('twitter', errMsg);
}

function taskErr (errMsg){
	_saveData('task', errMsg);
}

function webErr (errMsg){
	_saveData('web', errMsg);
}

function databaseErr (errMsg){
	_saveData('db', errMsg);
}

function _saveData (file, textData){
	textData =  Date() + " - " + textData;
	fs.appendFile( "logs/" + file + ".log", "\n\r"+ textData);
}

module.exports = {
	twitterErr: twitterErr,
	taskErr: taskErr,
	webErr: webErr,
	databaseErr: databaseErr
}