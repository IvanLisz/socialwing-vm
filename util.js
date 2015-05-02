function clone (obj) {
	return JSON.parse(JSON.stringify(obj));
};


function randomInt (min,max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

module.exports = {
	clone: clone,
	randomInt: randomInt
}