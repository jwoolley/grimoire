var GeneratorUtilities = function() {
	var colors = GeneratorGlobals.colors;

	var costFactors = {
		processCountables: { variability : 0.0 }
	};

	var colorfyCost = function(cmc, color, colorDiscountFactor, colorfyFunction) {
 		//TODO: refactor this to be more modular somehow
 		if (colorfyFunction) {
 			throw new Error('colorfyFunction not yet supported');
 		}	

 		var colorWeights = {
  			0: { min: 0, 	max: 0 },			
 			1: { min: 1, 	max: 1 },
 			2: { min: 1, 	max: 1.525 },
 			3: { min: 1, 	max: 1.55 },
 			4: { min: 1, 	max: 2 },
  			5: { min: 1, 	max: 2.51 },
 			6: { min: 1.33, max: 2.55 },
 			7: { min: 1.33, max: 2.66 }, 
  			8: { min: 1.4, 	max: 2.8 } 							
 		};

 		colorWeights.getNumColoredSymbols = function(cmc) {
 			var range = colorWeights[cmc] ? colorWeights[cmc] : { min: 1/cmc, max: cmc/2.5 };
 			return Math.round(Utilities.randomNumber(range.max, range.min));
 		}

 		var adjustedCmc = cmc;

		var numColoredSymbols = 0;
 		if (cmc !== 0) {
	 		numColoredSymbols = Math.max(1, colorWeights.getNumColoredSymbols(Math.floor(cmc)));
	 		if (Math.round(cmc) > 2 && Utilities.randomNumber(1) < colorDiscountFactor) {
	 			adjustedCmc = cmc - Math.floor(numColoredSymbols/2);
	 		}
	 		adjustedCmc = Math.max(1, Math.round(adjustedCmc));
	 	}

		var colorlessPart = (adjustedCmc - numColoredSymbols) > 0 ? addParameterTags(adjustedCmc - numColoredSymbols) : '';

		var manacosts = {};
		if ((adjustedCmc - numColoredSymbols) > 0 || numColoredSymbols == 0) {
			manacosts.C = adjustedCmc - numColoredSymbols;
		}	
		manacosts[GeneratorGlobals.manaTypes[color.code].code] = numColoredSymbols;
		return new ManaCost(manacosts);
	}

	var colorfyCostAndEncode= function(cmc, color, colorDiscountFactor, colorfyFunction) {
		var manaCost = colorfyCost(cmc, color, colorDiscountFactor, colorfyFunction)
		return encodeManaCost(manaCost);
	}

	var colorfyXCost = function(cmc, color, variabilityCost) {
		var numColoredSymbols = Math.floor(Math.min(2, Math.max(variabilityCost, cmc / 3) + 1));			
		return GeneratorUtilities.encodeManaCost(addParameterTags('X'), numColoredSymbols, color);
	}

	var encodeManaCost = function(manaCost) {
		return manaCost.encodeCost();
	}
	var addParameterTags = function(parameter) {
		return '{' + parameter + '}';
	}

	var getParameterTags = function(string) {
		var regEx = new RegExp('\{(.*?)\}', 'g');

		if (!string.match(regEx)) {
			return [];
		} else {
			return string.match(regEx);
		}

	}

	var stripParameterTags = function(parameter) {
		var regEx = new RegExp('\{(.*?)\}');
		if (!parameter.match(regEx)) {
			return parameter;
		}
		return parameter.match(regEx)[1];		
	}

	var getMatchingCountables = function(dependsOn, color, isEnumerable) {
		var countableList = countables[dependsOn];

		var matchingCountables = [];

		countableList.forEach(function(countable) {
			if (countable.colors.indexOf(color.code) != -1 && (countable.enumerable || !isEnumerable)) {
				matchingCountables.push(countable);
			}
		});

		return matchingCountables;
	};

	var getMatchingCountable = function(dependsOn, color, isEnumerable) {
		var matchingCountables = getMatchingCountables(dependsOn, color, isEnumerable);
		if (matchingCountables.length == 0) {
			throw new Error('No matching countables found for ' + dependsOn + ',' + color.name);
		}

		return matchingCountables[Utilities.randomInt(matchingCountables.length)];
	};

	var processCountables = function(card) {
		if (!card.countable) {
			return card;
		}
		var dependsOn = Utilities.randomElement(card.countable.dependsOn);
		var countable = getMatchingCountable(dependsOn, card.color, card.countable.isEnumerable);

		var replacementText = card.countable.isEnumerable ? countable.enumerable.text : countable.text;

		card.text = Utilities.replaceParameter(card.text, GeneratorGlobals.substitutionCodes.countable, replacementText);
		card.cmc = card.cmc * countable.powerFactor * Utilities.randomNumber(1 + costFactors.processCountables.variability, 1 - costFactors.processCountables.variability);
		card.cost.disallowX = true;

		return card;
	};

	var getColorByCode = function(code) {
		for(var i = 0; i < Object.keys(colors).length; i++) {
			if (colors[Object.keys(colors)[i]].code == code) {
				return colors[Object.keys(colors)[i]];
			}
		}
		return undefined;
	};

	var getColorCodeList = function() {
		var colorCodeList = [];
		for (color in colors) {
			colorCodeList.push(colors[color].code);
		}
		return colorCodeList;
	}

	//build cardClass map on initialization instead
	var getCardClasses = function(color) {
		var matchingCardClasses = [];

		objectClasses['card'].forEach(function(cardClass) {
			if (cardClass.colors.indexOf(color.code) != -1) {
				matchingCardClasses.push(cardClass);
			}
		});

		return matchingCardClasses;
	}

	// 
	var getRandomSpellEffect = function(spellMatrix, color) {
		var maxRetries = 99;
		var retries = 0;
		var spellEffect;
		do {
			spellEffect = spellMatrix[Utilities.randomInt(spellMatrix.length)];
			retries++;
		} while (retries < maxRetries && color && !(Utilities.arrayContains(spellEffect.colors, color.code)));
		return spellEffect;
	};

	var calculateScalableValues = function(card) {
		var regEx = new RegExp('\\{' + GeneratorGlobals.substitutionCodes.scalableNumber + '\\}', 'g');
		if (card.text.match(regEx)) {
			var variability = card.variability || card.baseCard.variability;
			if (!variability || !variability.baseValue || !variability.deviation || !variability.variabilityCost) {
				throw new Error('Card missing expected variability data: ' + JSON.stringify(card));
			}

			var baseValue = variability.baseValue || card.baseCard.variability.baseValue;
			var baseDeviation = variability.deviation;
			var variabilityCost = variability.variabilityCost;
			if (!(card.cost && card.cost.disallowX) && Utilities.randomNumber(1) < GeneratorGlobals.parameters.xLikelihood) {
				card.cost.colorfyFunction = GeneratorUtilities.colorfyXCost;
	 			card.cmc = card.cmc + variabilityCost * (baseDeviation + 1.5 - baseValue);
				card.text = card.text.replace(regEx, 'X');
				card.cost.hasX = true;	
			} else {
				var deviation = Utilities.roundRandom(Utilities.randomNumber(baseDeviation, -baseDeviation));

				if (baseValue + deviation < 1) {
					deviation = 0;
				}

				var differentialCost = deviation * variabilityCost;	
				card.cmc += differentialCost;
				card.text = card.text.replace(regEx, baseValue + deviation);
			}
			
		}
		return card;
	};

	function buildColorAbilityMap(colorMap, colorAbilityData) {
		var colorMap = Utilities.cloneArray(colorMap);
		var colorAbilityData = Utilities.cloneArray(colorAbilityData);

		for (color in colorMap) {
			colorMap[color] = [];
		};

		colorAbilityData.forEach(function(ability) {
			ability.colors.forEach(function(colorData) {
				var color = getColorByCode(colorData.color).name;
				colorMap[color].push( { 
					keyword: ability.keyword,
					text: ability.text, 					
					affinity: colorData.affinity, 
					isBuff: colorData.isBuff,
					nonBattlefield: ability.nonBattlefield,
					requiresAddon: ability.requiresAddon,
					costAdjustment: ability.costAdjustment,
					hasAbilityCost: ability.hasAbilityCost,
					complexity: ability.complexity ? ability.complexity : 1, // TODO: this should not be defined here. use a constructor?
					reminderText: ability.reminderText,
					isScalable: ability.isScalable,
					variability: ability.variability,
					exclusiveWith: ability.exclusiveWith
				});
			});
		});
		return colorMap;
	};

	//TODO: generalize this
	var spinCreatureEffectWheel = function(color) {
		var abilityWheel = [];
		var spinRange = 0.0;
		evergreenAbilities.forEach(function(abilityEntry) {
			var colorSpecificEntry = function() {
				var entry;
				abilityEntry.colors.forEach(function(colorEntry) {
					if (colorEntry.color === color.code)	 {
						entry = colorEntry;
					}
				});
				return entry;
			}();	
			if (colorSpecificEntry) {
				abilityWheel.push({ ability: abilityEntry.text, 
									threshold: spinRange + parseFloat(colorSpecificEntry.affinity), 
									costAdjustment: abilityEntry.costAdjustment });
				spinRange += parseFloat(colorSpecificEntry.affinity);
			}
		});

		var spinResult = Utilities.randomNumber(spinRange, 0);
		for (var i = 0; i < abilityWheel.length; i++) {
			if (abilityWheel[i].threshold > spinResult) {
				return abilityWheel[i].ability;
			}
		};
	};

	var replaceEffectParameters = function(card) {
		var substitutionCodes = GeneratorGlobals.substitutionCodes;
		//replace creature abilities (this is for spells that grant creature buffs, needs reworking)
		if (card.text.match(Utilities.getStringParamRegex(substitutionCodes.cardClass))) {
			//card.text = Utilities.replaceParameter(card.text, substitutionCodes.cardClass, Utilities.randomElement(getCardClasses(card.color)).text);				
			card.text = Utilities.replaceParameter(card.text, substitutionCodes.cardClass, Utilities.spinProbabilityWheel(Utilities.buildProbabilityWheel(getCardClasses(card.color), 'weight')).text);				
		}

		//replace creature type
		if (card.text.match(Utilities.getStringParamRegex(substitutionCodes.tokenCreatureType))) {
			card.text = Utilities.replaceParameter(card.text, substitutionCodes.tokenCreatureType, Utilities.randomElement(card.color.creatureTypes));			
		}

		//replace color words
		if (card.text.match(Utilities.getStringParamRegex(substitutionCodes.color))) {
			card.text = Utilities.replaceParameter(card.text, substitutionCodes.color, card.color.name);				
		}

		//replace creature abilities (this is for spells that grant creature buffs, needs reworking)
		if (card.text.match(Utilities.getStringParamRegex(substitutionCodes.creatureAbility))) {
			card.text = Utilities.replaceParameter(card.text, substitutionCodes.creatureAbility, spinCreatureEffectWheel(card.color));				
		}	

		return card;
	};

	var getSubtypeLine = function(subtypes) {
		if (subtypes && Array.isArray(subtypes)) {
			return Utilities.arrayToString(subtypes, ' ', function(type) { return Utilities.uppercaseFirstLetter(type); });
		}
		return '';
	}

	var getCreatureTypeListString = function(creatureTypes) {
		var creatureTypeText = creatureTypes[0];

		if (creatureTypes.length > 1) {
			for (var i = 1; i < creatureTypes.length - 1; i++) {
				creatureTypeText += ', ' + creatureTypes[i];
			}
			creatureTypeText += ' and/or ' + creatureTypes[creatureTypes.length - 1];
		}
		return creatureTypeText;
	}

	var textFixHacks = function(text, replaceNumerals) {
		text = text.replace(new RegExp('1 cards', 'g'), 'a card');
		text = text.replace(new RegExp('exactly a cards', 'g'), 'exactly one card');

		if (replaceNumerals) {
			var numeralMatches = text.match(new RegExp('\\w+\\s*[^\\+\\-/](\\d+\\s+\\w+?\\b)', 'g')) || text.match(new RegExp('(\\w+\\s+\\d+[^/])', 'g'));
			if (numeralMatches) {
				numeralMatches.forEach(function(match) { 
					if (!match.match('(\\d+)\\s+(damage|life)') && !match.match('cost\\s+(\\d+)') && !match.match(new RegExp('scry\\s+\\d+', 'i')) ) { 
						var numeral = match.match('\\d+');
						text = text.replace(match, match.replace(numeral, GeneratorGlobals.numberWordMap[parseInt(numeral)]));
					}
				});
			}
		}

		var vowelMatches = text.match(new RegExp('a\\s+([aeiou])', 'gi'))
		if (vowelMatches) {
			vowelMatches.forEach(function(match) {
				text = text.replace(match, match.slice(0, -1).replace('a ', 'an ') + match.slice(match.length - 1));
			});
		}
		return text;
	};

	var getCardCategories = function(card) {
		var categories = [];
		for (category in card.categories) {
			categories.push(category);
		}
		return categories;
	};

	GeneratorGlobals.evergreenAbilities = buildColorAbilityMap(GeneratorGlobals.colorKeys, evergreenAbilities);

	return { 
		addParameterTags: addParameterTags,
		getParameterTags: getParameterTags,
		stripParameterTags: stripParameterTags,
		encodeManaCost: encodeManaCost,
		colorfyCost: colorfyCost,
		colorfyCostAndEncode: colorfyCostAndEncode,
		colorfyXCost: colorfyXCost,
		processCountables: processCountables,
		getMatchingCountables: getMatchingCountables,
		getColorByCode: getColorByCode,	
		getRandomSpellEffect: getRandomSpellEffect,
		calculateScalableValues: calculateScalableValues,
		buildColorAbilityMap: buildColorAbilityMap,
		getColorCodeList: getColorCodeList,
		replaceEffectParameters: replaceEffectParameters,
		getSubtypeLine: getSubtypeLine,
		getCreatureTypeListString: getCreatureTypeListString,
		textFixHacks: textFixHacks,
		getCardCategories: getCardCategories
	};
}();