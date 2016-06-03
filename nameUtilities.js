var NameUtilities = function() {

	var CreatureNameUtilities = function() {
		var getMatchingCreatureWords = function(wordList, partOfSpeech, creature, callbacks, otherMatches) {
			var getAttributes = function(creature, criterion) {
				if (callbacks && callbacks[criterion]) {
					return callbacks[criterion](creature);
				} else {
					return creature[criterion];
				}
			};

			var allWords = wordList[partOfSpeech];
			var matchingWords = [];

			allWords.forEach(function(word) {
				if (word.matches) {
					var matchList = word.matches;
					for (var i = 0; i < matchList.length; i++) {
						var matchCriteria = Object.keys(matchList[i]);
						if (matchCriteria.every(function(criterion) {
							var creatureAttributes = getAttributes(creature, criterion);
							return creatureAttributes && creatureAttributes.some(function(attribute) {
								return (matchList[i][criterion].indexOf(attribute) !== -1);
							});
						})) {
							matchingWords = matchingWords.concat(word.words);
						}
					}
				}
			});
			if (otherMatches) {
				matchingWords = matchingWords.concat(otherMatches);
			}
			return matchingWords;
		}

		getMatchingCategoryWords = function(partOfSpeech, creature) {
			var matches = [];
			var partOfSpeechMap = GeneratorGlobals.wordMaps[partOfSpeech];
			for (category in creature.categories) {
				if (partOfSpeechMap[category]) {
					creature.categories[category].forEach(function(categoryValue) {
						if (partOfSpeechMap[category][categoryValue]) {
							matches = matches.concat(partOfSpeechMap[category][categoryValue]);
						}
					});
				}
			}

			return Utilities.removeDuplicates(matches);
		};

		var excludedCreatureTypeWords = ['human']; //TODO: make this not lame
		getCreatureEntityNouns = function(creature, creatureWordlist, wordlistFilters) {
			var entityList = getMatchingCreatureWords(creatureWordlist, 'entity', creature, {
				"color": function(creature) {
					return [creature.color.code];
				},
				"creatureType": function(creature) {
					return creature.subtypes;
				}
			}, Utilities.arrayDifference(creature.subtypes, excludedCreatureTypeWords));

			if (wordlistFilters) {
				wordlistFilters.forEach(function(filter) {
					entityList = Utilities.arrayIntersection(entityList, filter);
				});
			}

			return entityList;
		};

		getCreatureEntityNoun = function(creature, creatureWordlist, wordlistFilters) {
			return Utilities.randomElement(getCreatureEntityNouns(creature, creatureWordlist, wordlistFilters));
		}

		getCreatureCompoundNoun = function(creature, filteredWordMaps, creatureWordlist) {
			// TODO: filter on creature abilities too!!!
			// TODO: include verbs (and adjectives?)
			var colorNouns = Utilities.arrayIntersection(
				GeneratorGlobals.wordMaps.noun.usage.compound,
				GeneratorGlobals.wordMaps.noun.color[creature.color.code]);

			var colorVerbs = Utilities.arrayIntersection( 
				GeneratorGlobals.wordMaps.verb.usage.compound,
				GeneratorGlobals.wordMaps.verb.color[creature.color.code]);

			var colorAdjectives = Utilities.arrayIntersection( 
				GeneratorGlobals.wordMaps.adjective.usage.noun,
				GeneratorGlobals.wordMaps.adjective.color[creature.color.code]);

			var locationNouns = Utilities.arrayIntersection(
				GeneratorGlobals.wordMaps.environmentWordMaps.location.usage.compound,
				GeneratorGlobals.wordMaps.environmentWordMaps.location.color[creature.color.code]);

			var firstParts = colorNouns.concat(colorVerbs).concat(colorAdjectives).concat(locationNouns);

			//TODO: filter on effects (if word is in any of GeneratorGlobals.wordMaps.*.effect, then only match when creature has the effect)
			// colorNouns = Utilities.arrayDifference(colorNouns, Utilities.flattenArrayMap(GeneratorGlobals.wordMaps.noun.effect));

			var firstPart = Utilities.randomElement(firstParts);
			var secondPart = getCreatureEntityNoun(creature, creatureWordlist, [GeneratorGlobals.wordMaps.creatureWordMaps.entity.usage.compound]);
			if (firstPart && secondPart) {
				return firstPart + secondPart;
			}
			return;
		} 

		var creatureAdjectives;
		var targetNouns;

		var creatureNameFunctions = {
			'adjectiveNoun': function(creature, wordlist) {
				creatureAdjectives = creatureAdjectives ? creatureAdjectives: GeneratorGlobals.wordMaps['adjective']['creature'][true];
				var colorAdjectives = Utilities.arrayIntersection(creatureAdjectives, GeneratorGlobals.wordMaps['adjective']['color'][creature.color.code]);
				var categoryAdjectives = getMatchingCategoryWords('adjective', creature);
				var environments = GeneratorGlobals.wordMaps.environmentWordMaps['location']['color'][creature.color.code];
				
				var adjectiveList = Utilities.arrayUnion(colorAdjectives, categoryAdjectives);
				adjectiveList = Utilities.arrayUnion(adjectiveList, environments);
				var adjective = Utilities.randomElement(adjectiveList);

				var noun = getCreatureCompoundNoun(creature, GeneratorGlobals.wordMaps, wordlist);
			
				if (adjective && noun > 0) {
					return adjective + ' ' + noun;
				}
				return;
			},
			'adjectiveCompoundNoun': function(creature, wordlist) {
				var colorAdjectives = Utilities.arrayDifference(
					GeneratorGlobals.wordMaps['adjective']['color'][creature.color.code],
					GeneratorGlobals.wordMaps.adjective.usage.noun
				);
				var categoryAdjectives = getMatchingCategoryWords('adjective', creature);
				
				var adjectiveList = Utilities.arrayUnion(colorAdjectives, categoryAdjectives);
				var adjective = Utilities.randomElement(adjectiveList);

				var compoundNoun = getCreatureCompoundNoun(creature, GeneratorGlobals.wordMaps, wordlist);
				var nounCandidates = [getCreatureEntityNoun(creature, wordlist)];
				if (compoundNoun) {
					nounCandidates.push(compoundNoun);
				}

				if (adjective && nounCandidates.length > 0) {
					return adjective + ' ' + Utilities.randomElement(nounCandidates);
				}
				return;
			},			
			'xOfY': function(creature, wordlist) {
				var entity = getCreatureEntityNoun(creature, wordlist, [GeneratorGlobals.wordMaps.creatureWordMaps.entity.usage.dispositional]);

				var categoryNouns = getMatchingCategoryWords('abstractNoun', creature);
				var nounList = Utilities.arrayUnion(categoryNouns, GeneratorGlobals.wordMaps['abstractNoun']['color'][creature.color.code]);
				var noun = Utilities.randomElement(nounList);



				if (entity && noun) {
					return entity + ' of ' + noun;
				}
				return;
			},
			'compound': function(creature, wordlist) {
				var isHumanoid = creature.subtypes.creatureTypes.some(function(creatureType) {
					return CreatureGlobals.creatureTypeMap.humanoids.map(function(humanoidType) {
						return humanoidType.type; 
					}).indexOf(creatureType) > -1;
				});
				if (isHumanoid) {
					return;
				}
				return getCreatureCompoundNoun(creature, GeneratorGlobals.wordMaps, wordlist);
			}
		};

		var defaultCreatureNameFunction = function(creature, wordlist) {
			return GeneratorUtilities.getSubtypeLine(creature.subtypes);
		}

		var generateRandomName = function(creature, wordlist) {
			var name;
			var functionNames = Object.keys(creatureNameFunctions);
			while (!name && functionNames.length > 0) {
				var functionName = Utilities.randomElement(functionNames);
				name = creatureNameFunctions[functionName](creature, wordlist);
				if (!name) {
					Utilities.removeElement(functionNames, functionName);
				}
			}

			if (!name) {
				name = defaultCreatureNameFunction(creature, wordlist);
			}

			return name;
		}

		return {
			generateRandomName: generateRandomName
		}
	}();



	return {
		CreatureNameUtilities: CreatureNameUtilities
	}
}();