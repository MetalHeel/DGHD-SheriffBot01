module.exports = {
	TWENTY_MINUTES_IN_MILLISECONDS: 1200000,
	THIRTY_MINUTES_IN_MILLISECONDS: 1800000,
	FOURTY_MINUTES_IN_MILLISECONDS: 2400000,
	ONE_HOUR_IN_MILLISECONDS: 3600000,
	TWO_HOURS_IN_MILLISECONDS: 7200000,
	THREE_HOURS_IN_MILLISECONDS: 10800000,
	
	encapsulateIdIntoMention: function(userId, useNickname = false) {
		if (useNickname) {
			return "<@" + userId + ">";
		} else {
			return "<@!" + userId + ">";
		}
	},
	
	encapsulateIdIntoChannelMention: function(channelId) {
		return "<#" + channelId + ">";
	},
	
	extractIdFromMention: function(mention) {
		var startingIndex = 2;
		if (mention.startsWith("<@!") || mention.startsWith("<@&")) {
			var startingIndex = 3;
		}
		return mention.substring(startingIndex, mention.length - 1);
	},
	
	isDirectMention: function(content, userId) {
		return content.startsWith("<@!" + userId + ">") || content.startsWith("<@" + userId + ">");
	},
	
	// TODO: Probably should do some validation in here.
	getRandomNumberBetweenXAndY: function(lowerLimit, higherLimit) {
		return Math.round(Math.random() * (higherLimit - lowerLimit) + lowerLimit);
	}
}