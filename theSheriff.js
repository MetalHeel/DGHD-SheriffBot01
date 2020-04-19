const utility = require('./utility.js');

module.exports.theSheriff = {
	userId: null,
	channel: null,
	patrol: false,
	currentAccuser: null,
	currentSuspect: null,
	lastAccusationTime: null,
	lastCheckAroundTheBeat: null,
	timeUntilNextBeatCheckLowerLimit: utility.TWO_HOURS_IN_MILLISECONDS,
	timeUntilNextBeatCheckHigherLimit: utility.THREE_HOURS_IN_MILLISECONDS,
	timeUntilNextBeatCheck: null,
	lastChatTime: 0,
	jail: {}
};