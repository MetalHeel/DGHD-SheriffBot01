const utility = require('./utility.js');

module.exports.theSheriff = {
	userId: null,
	channel: null,
	currentAccuser: null,
	currentSuspect: null,
	lastAccusationTime: null,
	lastCheckAroundTheBeat: null,
	timeUntilNextBeatCheckLowerLimit: utility.FOURTY_MINUTES_IN_MILLISECONDS,
	timeUntilNextBeatCheckHigherLimit: utility.ONE_HOUR_IN_MILLISECONDS,
	timeUntilNextBeatCheck: null,
	lastChatTime: 0,
	jail: {}
};