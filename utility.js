module.exports = {
	encapsulateIdIntoMention: function(userId) {
		return "<@!" + userId + ">";
	},
	
	extractIdFromMention: function(mention) {
		var startingIndex = 2;
		if (mention.startsWith("<@!")) {
			var startingIndex = 3;
		}
		
		return mention.substring(startingIndex, mention.length - 1);
	},
	
	isDirectMention: function(content, userId) {
		return content.startsWith("<@!" + userId + ">") || content.startsWith("<@" + userId + ">");
	}
}