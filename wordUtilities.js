WordUtilities = function() {

	var wordLists = Object.freeze({
		'adjective': wordList.adjective,
		'noun': wordList.noun,
		'verb': wordList.verb,
		'abstractNoun': wordList.abstractNoun,
	});

	var getRandomNoun = function() {
		return Utilities.randomElement(wordLists.noun).word;
	}

	var getRandomAdjective = function() {
		return Utilities.randomElement(wordLists.adjective).word;
	}

	var getRandomVerb = function() {
		return Utilities.randomElement(wordLists.verb).word;
	}	

	var capitalizeWord = function(word) {
		word = word.charAt(0).toUpperCase() + word.slice(1);
		for (var i = 1; i < word.length - 1; i++) {
			if (word.charAt(i).match(/[^A-Za-z']/i)) {
				word = word.substring(0, i+1) + word.charAt(i+1).toUpperCase() + word.slice(i+2);
			}
		}
		return word;
	}

	var capitalizeWords = function(string) {
		return string.split(/\s+/).reduce(function(prev, word) {
			return prev + ' ' + capitalizeWord(word);
		}, '').trim();
	}

	var buildWordMaps = function(wordList) {
		// var wordMaps = {
		// 	'adjective': {},			
		// 	'noun': {},
		// 	'verb': {},
		// 	'abstractNoun': {}
		// }
		var wordMaps = {};
		var partsOfSpeech = Object.keys(wordList);
		partsOfSpeech.forEach(function(partOfSpeech){
			wordMaps[partOfSpeech] = {};
		});

		for(partOfSpeech in wordList) {
			var list = wordList[partOfSpeech];
			var map =  wordMaps[partOfSpeech];

			map.color = {};
			GeneratorUtilities.getColorCodeList().forEach(function(color) {
				map.color[color] = [];
			});

			list.forEach(function(word) {
				if (word.category) {
					for(categoryName in word.category) {
						if (!(categoryName in map)) {
							map[categoryName] = {};
						}
						word.category[categoryName].forEach(function(element) {
							if (!map[categoryName][element]) {
								map[categoryName][element] = [];
							}
							if (word.words) {
								map[categoryName][element] = map[categoryName][element].concat(
									word.words.map(function(word) {
										return word.toLowerCase(); 
									})
								);
							} else {
								map[categoryName][element].push(word.word.toLowerCase());
							}
						});
					}
				}
				if (!word.category  /* || !word.category.color */ ) {
					GeneratorUtilities.getColorCodeList().forEach(function(color) {
						if (word.words) {
							map.color[color] = map.color[color].concat(
								word.words.map(function(word) {
									return word.toLowerCase(); 
								})
							);
						} else {
							map.color[color].push(word.word.toLowerCase());
						}
					});
				}
			});
		}

		return wordMaps;
	}

	var initializeWordCategories = function(wordLists) {
		for(partOfSpeech in wordList) {
			wordLists[partOfSpeech].forEach(function(word) {
				if (!word.category || !word.category.color) {
					$.extend( true, word, { category: { color: GeneratorUtilities.getColorCodeList() } } );
				}
			});
		}
	}

	var mixCategories = function(categories1, categories2) {
		var mixedCategories = {};
		if (!categories1) {
			categories1 = {};
		}
		if (!categories2) {
			categories2 = {};
		}

		var combinedCategories = Utilities.arrayUnion(Object.keys(categories1),Object.keys(categories2));

		combinedCategories.forEach(function(category) {
			mixedCategories[category] = Utilities.arrayUnion(
				categories1[category] ? categories1[category] : [], 
				categories2[category] ? categories2[category] : []);
		});

		return mixedCategories;
	}

	var categoryMatches = function(word, card) {
		var categories = [];

		for (categoryName in card.categories) {
			if (categoryName in word.category) {
				var category = card.categories[categoryName];
				category.forEach(function(element) {
					if (word.category[categoryName].indexOf(element.toLowerCase()) != -1 && categories.indexOf(categoryName.toLowerCase()) == -1) {
						categories.push(categoryName);
					}
				});
			}
		}

		return categories;
	};

	return {
		getRandomNoun: getRandomNoun,
		getRandomAdjective: getRandomAdjective,
		getRandomVerb: getRandomVerb,
		capitalizeWord: capitalizeWord,
		capitalizeWords: capitalizeWords,
		buildWordMaps: buildWordMaps,
		mixCategories: mixCategories,	
		categoryMatches: categoryMatches,
		initializeWordCategories: initializeWordCategories
	}
}();