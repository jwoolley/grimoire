 CreatureGenerator = function() {

	var creatureCostProbabilities = [
		.007,	// 0
		.079,	// 1
		.183,	// 2
		.222,	// 3
		.204,	// 4
		.147,	// 5
		.092,	// 6
		.040	// 7
	]

	var expansionAbilities = function() {
		var keywordMap = CreatureGlobals.expansionAbilitiesByColor;
		if (CreatureGlobals.expansionKeywordFilter) {
			keywordMap = CreatureUtilities.filterAbilitiesByKeywords(keywordMap, CreatureGlobals.expansionKeywordFilter);
		}
		return keywordMap;
	}();

	var generateRandomCreatureAbilities = function(creature, maxComplexity) {
		var cardText = '';		

		var complexity = 0;

		// TODO: move to CreatureGlobals (or a new associated JSON file)
		var frenchVanillaProbabilities = [.5, .2, .1];
		var expansionAbilityProbability = .33;
		var expansionAddonProbability = .5;		
		var triggeredEffectProability = .5;
		creature.abilities = [];
		var abilities;

		var totalCmc = 0;

		var keywordAbilities = CreatureGlobals.evergreenKeywordsByColor[creature.color.name].slice(0);
		var abilities = [];		
		for (var i = 0; i < frenchVanillaProbabilities.length && complexity < maxComplexity && keywordAbilities.length > 0; i++) {
			var random = Utilities.randomNumber(1, 0);
			if (random < frenchVanillaProbabilities[i]) {
				//var ability = Utilities.randomElement(keywordAbilities);
				var probabilityWheel = Utilities.buildProbabilityWheel(keywordAbilities, function(ability) {return ability.affinity; });

				var ability = Utilities.spinProbabilityWheel(probabilityWheel);

				if (abilities.length == 0 || CreatureUtilities.checkExclusion(abilities, ability)) {
					Utilities.removeElement(keywordAbilities, ability);
					totalCmc += ability.costAdjustment;

					var superDuperDefenderHack = function(creature, ability) {
						if (ability.keyword === 'defender') {
							if (creature.powerToughness.power + creature.powerToughness.toughness < 3) {
								creature.powerToughness.toughness++;
							}
							var powerDiscount = 0, max = creature.powerToughness.power;
							while (powerDiscount < max && Utilities.randomInt(4) !== 0) { 
								if (creature.powerToughness.power > 0) {
									creature.powerToughness.power--;
									creature.powerToughness.toughness++;
								}	
							}
						}
					}(creature, ability);

					abilities.push(ability);
					complexity = ability.complexity;
				}
			} else {
				break;
			}
		}
		if (abilities.length > 0) {
			cardText = CreatureUtilities.appendCardText(cardText, Utilities.uppercaseFirstLetter(Utilities.arrayToString(abilities.map(function(ability) { return ability.text; }), ', ')));
			creature.abilities = creature.abilities.concat(abilities);
		}

		var hasTriggeredAbility = false;
		var random = Utilities.randomNumber(1, 0);
		if (complexity < maxComplexity && random < expansionAbilityProbability) {
			var maxComplexity = maxComplexity;
			var addon = Utilities.randomNumber(1, 0) < expansionAddonProbability;
			var filteredKeywords = {};
			var colorFilteredKeywords = CreatureUtilities.filterExclusions(expansionAbilities[creature.color.name], abilities);
			filteredKeywords[creature.color.name] = colorFilteredKeywords;
			if (filteredKeywords[creature.color.name].length > 0) {
				var ability = CreatureAbilityFunctions.getRandomKeywordAbility(filteredKeywords, creature, creature.color, addon);
				if (complexity + ability.complexity <= maxComplexity) {
					totalCmc += ability.costAdjustment;
					complexity += ability.complexity;
					cardText = CreatureUtilities.appendCardText(cardText, Utilities.uppercaseFirstLetter(ability.text));
					hasTriggeredAbility = ability.hasTriggeredAbility;
					creature.abilities.push(ability);
				} else {
					Utilities.debug('Complexity limit exceeded. complexity: ' + complexity + ', ability.complexity: ' + ability.complexity + ', maxComplexity: ' + maxComplexity);
				}
			} else {
				Utilities.debug('no available keywords found for color: ' + creature.color.name);
			}
		}

		random = Utilities.randomNumber(1, 0);
		if (!hasTriggeredAbility && complexity < maxComplexity && random < triggeredEffectProability) {
			var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color, CreatureGlobals.triggerConditions, abilities);
			abilities.push(triggeredAbility);
			creature.abilities.push(triggeredAbility);
			totalCmc += triggeredAbility.cmc;
			cardText = CreatureUtilities.appendCardText(cardText, triggeredAbility.text);
		}

		var keywords = function(abilities) {
			var keywords = [];
			abilities.forEach(function(ability) {
				if (ability.keyword && keywords.indexOf(ability.keyword) === -1) {
					keywords.push(ability.keyword);
				}
			});
			return keywords;
		}(abilities);

		var categories = function(abilities) {
			var categories = {};
			abilities.forEach(function(ability) {
				if (ability.categories) {
					for (category in ability.categories) {
						if (!categories[category]) {
							categories[category] = Utilities.cloneArray(ability.categories[category]);
						} else {
							categories[category] = categories[category].concat(ability.categories[category]);
						}
					}
				}
			});
			return categories;
		}(abilities);

		cardText = GeneratorUtilities.replaceEffectParameters({ color: creature.color, text: cardText }).text;

		return { cardText : cardText, cmc : totalCmc, abilities: abilities, keywords: keywords, categories: categories };
	}

	var keywordsRequiringMatchingType = ['flying'];

	var getCreatureTypes = function(creature, creatureTypeMap) {
		var fallbackTypes = ['Spirit', 'Elemental'];

		var type;

		var getMatchingType = function(creatureTypes, creature) {
			var type;
				while (!type && creatureTypes.length > 0) {
				var randomType = Utilities.randomElement(creatureTypes);
				if (randomType.requires && randomType.requires.keywords) {
					var requirementsUnmet = false;
					randomType.requires.keywords.forEach(function(keyword) {
						if (!Utilities.arrayContains(creature.keywords, keyword)) {
							Utilities.removeElement(creatureTypes, randomType);
							requirementsUnmet = true;
							return;
						}
						type = randomType;
					});
				} else {
					type = randomType;
				}
			};
			return type;
		}

		var filterByKeywords = function(creatureTypes, keywords) {creatureTypes
			keywords.forEach(function(keyword) {
				if (Utilities.arrayContains(keywordsRequiringMatchingType, keyword)) {
					creatureTypes = creatureTypes.filter(function(creatureType) {
						return creatureType.keywords && Utilities.arrayContains(creatureType.keywords, keyword);
					});
				}
			});
			return creatureTypes;
		}

		var filterByCategory = function(creatureTypes, category, exclusion) {
			return creatureTypes.filter(function(creatureType) {
				if (exclusion) {
					return !creatureType.categories || !Utilities.arrayContains(creatureType.categories, category);					
				} else {
					return creatureType.categories && Utilities.arrayContains(creatureType.categories, category);
				}
			});
		}

		var getCreatureTypesForPower = function(creatureTypes, colorCode, power) {
			if (power < 1) {
				power = 1;
			}
			return Utilities.cloneArray(CreatureGlobals.creatureTypeMap.races.powerMap.colors[colorCode][power]);
		}

		var creatureTypeFunctions = {
			getSimpleCreatureType: function(creature, creatureTypeMap) {
				var creatureTypes = getCreatureTypesForPower(creatureTypes, creature.color.code, creature.powerToughness.power);
				creatureTypes = filterByKeywords(creatureTypes, creature.keywords);
				creatureTypes = filterByCategory(creatureTypes, "class", true);
				creatureTypes = filterByCategory(creatureTypes, "parasite", true);

				var type = getMatchingType(creatureTypes, creature);

				if (!type) {
					return [];
				}
				return [type.type];
			},

			getRaceClassCreatureTypes: function(creature, creatureTypeMap) {
				var creatureTypes = getCreatureTypesForPower(creatureTypes, creature.color.code, creature.powerToughness.power);
				var humanoidRaces = filterByKeywords(filterByCategory(creatureTypes, 'humanoid'), creature.keywords);
				var classes = filterByCategory(creatureTypes, 'class');

				var randomRace = Utilities.randomElement(humanoidRaces);
				var randomClass = Utilities.randomElement(classes);

				if (!randomRace || !randomClass) {
					return [];
				}

				return [ randomRace.type, randomClass.type ];
			}
		};

		var types;
		var functionNames = Object.keys(creatureTypeFunctions);
		while (!types && functionNames.length > 0) {
			var functionName = Utilities.randomElement(functionNames);
			types = creatureTypeFunctions[functionName](creature, creatureTypeMap);
			if (!types) {
				Utilities.removeElement(functionNames, functionName);
			}
		}

		if (!types || types.length == 0) {
			types = [Utilities.randomElement(fallbackTypes)];
		}

		return types;
	}

	var generateCreature = function(filters) {
		var filterColors = [];
		if (filters && filters.colors) {
			filterColors = filters.colors;
		}
	 	var color = filters.colors ? GeneratorUtilities.getColorByCode([Utilities.randomElement(filterColors).toUpperCase()]) : Utilities.randomElement(CreatureGlobals.colors);

		var cmc = CreatureUtilities.spinCmcWheel(creatureCostProbabilities);
		var powerToughness = CreatureUtilities.generateBasePowerToughness(cmc, color);

		var creature = {
			type: 'Creature',
			cost: '',
			text: '',			
			powerToughness: powerToughness,
			subtypes: [],			
			color: color,
			cmc: cmc	
		}

		// TODO: activated abilities
		var abilities = generateRandomCreatureAbilities(creature, 4);
		creature.text = GeneratorUtilities.textFixHacks(abilities.cardText);
		//creature.abilities = abilities.abilities;
		creature.keywords = abilities.keywords;
		creature.categories = abilities.categories;
		
		var abilityDiscountPower = 0.75;
		var discountThreshold = 3;
		var discountLogBase = 1.75;

		if (abilities.cmc >= 1) {
			creature.cmc += (Math.pow(abilities.cmc, abilityDiscountPower)) / (creature.cmc > discountThreshold ? (Math.log(creature.cmc)/Math.log(discountLogBase)) : 1);
		} else if (abilities.cmc >= 0) {
			creature.cmc += Math.min(0, Math.pow(abilities.cmc, 1.66));
		}
		else {
			creature.cmc += abilities.cmc;
		}
		var existingCreatureTypes = creature.subtypes ? creature.subtypes : [];
		var creatureTypes = creature.subtypes.locked ? existingCreatureTypes : Utilities.arrayUnion(existingCreatureTypes, getCreatureTypes(creature, CreatureGlobals.creatureTypeMap));
		creature.subtypes = Utilities.arrayUnion(creature.subtypes, creatureTypes ? creatureTypes : []);
		creature.subtypes.creatureTypes = creature.subtypes;

		if (creature.text.match(Utilities.getStringParamRegex(GeneratorGlobals.substitutionCodes.creatureTypeList))) {
			creature.text = Utilities.replaceParameter(creature.text, GeneratorGlobals.substitutionCodes.creatureTypeList, GeneratorUtilities.getCreatureTypeListString(creature.subtypes));
		}

		var discountCmc = function(cmc) {
			var discountThreshold = 7;
			var discountFactor = .2;
			if (cmc < discountThreshold) {
				return cmc;
			} else {
				return discountThreshold + Math.pow(cmc - discountThreshold, discountFactor);
			}
		}

		creature.cost = GeneratorUtilities.colorfyCostAndEncode(Math.max(1, discountCmc(creature.cmc)), color);

		return creature;
	};

	return { generateCreature : generateCreature };
}();