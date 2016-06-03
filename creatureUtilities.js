CreatureUtilities = function() {

	var spinCmcWheel = function(costProbabilities) {
		var thresholds = [];
		var total = 0;
		costProbabilities.forEach(function(cost, index) {
			total += cost;
			thresholds[index] = total;
		});

		var spinResult = Utilities.randomNumber(total, 0);
		for (var i = 0; i < thresholds.length; i++) {
			if (thresholds[i] >= spinResult) {
				return i;
			}
		};
	}

	var spellEffects = CreatureGlobals.spellEffects;

	var MIN_CREATURE_POWER = 0;
	var MIN_CREATURE_TOUGHNESS = 1;
	var MAX_CREATURE_POWER = 20;
	var MAX_CREATURE_TOUGHNESS = 20;

	var basePowerToughnessRerollProbability = .67;
	var generateBasePowerToughness = function(cmc, color) {
		var sizeMatrix;
		if (color.name in creatureSizeMatrix && creatureSizeMatrix[color.name][cmc]) {
			sizeMatrix = creatureSizeMatrix[color.name];
		} else {
			sizeMatrix = creatureSizeMatrix.generic;
		}

		var sizes = sizeMatrix[cmc];
		if (!sizes) {
			throw new Error('No creature sizes defined for cmc = ' + cmc);
		}

		if (sizes.length == 1) {
			return { power: sizes[0].p, toughness: sizes[0].t };
		}

		// keep rolling until we get a value
		for (var i = 0; i < sizes.length; i++) {
			var random = Utilities.randomNumber(1, 0);
			if (random > basePowerToughnessRerollProbability) {
				return { power: sizes[i].p, toughness: sizes[i].t };
			} else if (i == sizes.length - 1) {
				i = 0;
			}
		}
	}	

	var appendCardText = function(text, newText) {
		if (!!text && text.length > 0) {
			text += '\n' + newText;
		} else {
			text = newText;
		}
		return text;
	}

	var getRandomSpellEffect = function(color, sorceryAffinityThreshold) {
		var effect;
		do  {
			effect = Utilities.cloneObject(GeneratorUtilities.getRandomSpellEffect(spellEffects, color));
		} while (!effect || sorceryAffinityThreshold !== undefined && effect.sorceryAffinity < sorceryAffinityThreshold)

		effect.text = effect.ability;
		effect = GeneratorUtilities.calculateScalableValues(effect);
		return { text: Utilities.lowercaseFirstLetter(GeneratorUtilities.textFixHacks(effect.text, true)), cmc : effect.cmc, categories: effect.categories };
	}

	var getRandomKeywordAbility = function(colorName, abilityList) {
		return Utilities.randomElement(abilityList[colorName]);
	}

	var getRandomTriggeredEffect = function(creature, conditions, existingAbilities) {
		var sorceryAffinityThreshold = .25;
		var condition = Utilities.randomElement(conditions);

		var effect = getRandomSpellEffect(creature, sorceryAffinityThreshold);
		while (!condition.meetsRequirements(effect, existingAbilities.map(function(ability) { return ability.keyword }))) {
			condition = Utilities.randomElement(conditions);
			effect = getRandomSpellEffect(creature, sorceryAffinityThreshold)
		}
		effect.text = condition.templateFunction(effect.text);
		return effect;
	};

	var getRandomExpansionAbility = function(color, abilityMap) {
		var keyword = Utilities.randomElement(abilityMap[color.name]);
		keyword.text = keyword.text;
		keyword.text += ' (' + keyword.reminderText + ')';
		return keyword;
	};


	var CreatureTypePowerMap = function(minPower, maxPower) {
		this.minPower = minPower;
		this.maxPower = maxPower;
		this.powerMap = { colors: {} };

		var colors = Object.keys(CreatureGlobals.colors);

		for (var i = 0; i < colors.length; i++) {
			var colorCode = CreatureGlobals.colors[colors[i]].code;
			this.powerMap.colors[colorCode] = [];
			for (var j = minPower; j <= maxPower; j++) {
				this.powerMap.colors[colorCode][j] = [];
			}
		}
	}

	var buildCreatureTypeMap = function(creatureTypes) {
		var races = new CreatureTypePowerMap(MIN_CREATURE_POWER, MAX_CREATURE_POWER);		
		var humanoids = [];	
		var classes = [];

		creatureTypes.forEach(function(creatureType) {
			var colors = Object.keys(races.powerMap.colors);
			for(var j = 0; j < colors.length; j++)	{
			 	if (Utilities.arrayContains(creatureType.colors, colors[j])) {			
					for (var i = races.minPower; i <= races.maxPower; i++) {
						if ((!creatureType.range || !creatureType.range.power || 
							((!creatureType.range.power.min || i >= creatureType.range.power.min ) && 
							 (!creatureType.range.power.max || i <= creatureType.range.power.max)))) {
							races.powerMap.colors[colors[j]][i].push(creatureType);
						}			
					}
				 }
			}

			if (creatureType.categories) {
				if (Utilities.arrayContains(creatureType.categories, "humanoid")) {
					humanoids.push(creatureType);
				}

				if (Utilities.arrayContains(creatureType.categories, "class")) {
					classes.push(creatureType);
				}
			}			
		});

		return {
			races: races,
			humanoids: humanoids,
			classes: classes
		}
	};

	var checkExclusion = function(existingAbilities, newAbility) {
		return !existingAbilities.some(function(ability) {
			return ability.exclusiveWith && Utilities.arrayContains(ability.exclusiveWith, newAbility.keyword)
				|| newAbility.exclusiveWith && Utilities.arrayContains(newAbility.exclusiveWith, ability.keyword);
		});
	}

	var filterExclusions = function(abilities, existingAbilities) {
		var filteredAbilities = [];
		if (existingAbilities) {
			abilities.forEach(function(ability) {
				if (existingAbilities.every(
						function(existingAbility) { 
							return !checkExclusion(abilities, existingAbility); 
						})
					) {
					filteredAbilities.push(ability);
				}
			});
			return filteredAbilities;
		}
		return abilities;
	}

	return {
		spinCmcWheel: spinCmcWheel,
		buildCreatureTypeMap: buildCreatureTypeMap,
		generateBasePowerToughness: generateBasePowerToughness,
		appendCardText: appendCardText,
		getRandomTriggeredEffect: getRandomTriggeredEffect,
		getRandomKeywordAbility: getRandomKeywordAbility,		
		checkExclusion: checkExclusion,
		createColorAbilityMap: CreatureGlobals.createColorAbilityMap,
		filterAbilitiesByKeywords: CreatureGlobals.filterAbilitiesByKeywords,
		filterAbilitiesByFields: CreatureGlobals.filterAbilitiesByFields,
		filterExclusions: filterExclusions
	}
}();