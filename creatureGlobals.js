var CreatureGlobals = function() {	

	var staticData = creatureGlobalInitData;

	var createColorAbilityMap = function(arrayOfAbilitiesArrays) {
		var abilities = [];
		arrayOfAbilitiesArrays.forEach(function(array) {
			abilities = abilities.concat(array);
		});

		return GeneratorUtilities.buildColorAbilityMap(GeneratorGlobals.colorKeys, Utilities.cloneArray(abilities));
	};

	var filterAbilitiesByKeywords = function(colorAbilityMap, filterKeywords, exclude) {
		var filteredMap = {};
		for (color in colorAbilityMap) {
			filteredMap[color] = colorAbilityMap[color].reduce(function(list, ability) {
				if (!!exclude !== Utilities.arrayContains(filterKeywords, ability.keyword)) {
					list.push(ability);
				}
				return list;
			}, []);
		}
		return filteredMap;
	};

	var filterAbilitiesByFields = function(colorAbilityMap, fieldMap) {
		var filteredMap = {};
		for (color in colorAbilityMap) {
			filteredMap[color] = colorAbilityMap[color].reduce(function(list, ability) {
				var matches = true;
				for (field in fieldMap) {
					matches = matches && !!ability[field] == !!fieldMap[field];
				}
				if (matches) {
					list.push(ability);
				}
				return list;
			}, []);
		}
		return filteredMap;
	};

	var evergreenKeywordsByColor = GeneratorGlobals.evergreenAbilities;
	/*
	TODO: add filter support to index.html
	if (staticData.creatureEvergreenAbilityFilter) {
		evergeenKeywordsByColor = filterAbilitiesByKeywords(evergeenKeywordsByColor, staticData.creatureEvergreenAbilityFilter);
	}
	*/

	var expansionAbilitiesByColor = createColorAbilityMap([ staticData.creatureAbilities.expansionAbilities, staticData.creatureAbilities.scalableCreatureAbilities]);
	if (staticData.creatureExpansionAbilityFilter) {
		expansionAbilitiesByColor = filterAbilitiesByKeywords(expansionAbilitiesByColor, staticData.creatureExpansionAbilityFilter);
	}

	// TODO: move to a separate data file
	var combatEffects = ['combatTrick', 'tapDown', 'creatureBuff', 'massBuff', 'threaten', 'falter'];

	var triggerConditions = {
		'etb' : {
			templateFunction: function(abilityText) {
				return 'When ~ enters the battlefield, ' + abilityText;
			},
			meetsRequirements: function(ability) {
				return true;
			}
		},
		'deathTrigger': {
			templateFunction: function(abilityText) {
				return 'When ~ dies, ' + abilityText;	
			},
			meetsRequirements: function(ability) {
				return !(ability.categories && ability.categories.effect &&
					Utilities.arrayIntersection(ability.categories.effect, combatEffects).length > 0);
			}
		},
		'saboteur': {
			templateFunction: function(abilityText) {				
				return 'When ~ deals combat damage to a player, ' + abilityText;	
			},
			meetsRequirements: function(ability, existingAbilities) {
				return !(ability.categories && ability.categories.effect && (Utilities.arrayContains(existingAbilities, 'defender') ||
					Utilities.arrayIntersection(ability.categories.effect, combatEffects).length > 0));
	 		}
		},

		// add unmorph for creatures with morph		

		// clash? make this array extensible via API
	};


	var MIN_CREATURE_POWER = 0;
	var MIN_CREATURE_TOUGHNESS = 1;
	var MAX_CREATURE_POWER = 20;
	var MAX_CREATURE_TOUGHNESS = 20;

	var CreatureTypePowerMap = function(minPower, maxPower) {
		this.minPower = minPower;
		this.maxPower = maxPower;
		this.powerMap = { colors: {} };

		

		var colors = Object.keys(Utilities.cloneObject(GeneratorGlobals.colors));

		for (var i = 0; i < colors.length; i++) {
			var colorCode = GeneratorGlobals.colors[colors[i]].code;
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

	var creatureTypeMap = buildCreatureTypeMap(creatureTypes);

	var battlefieldBuffKeywords = filterAbilitiesByFields(evergreenKeywordsByColor, { 'isBuff': true, 'nonBattlefield': false });

	creatureGlobalInitData.evergreenKeywordsByColor = evergreenKeywordsByColor;
	creatureGlobalInitData.expansionAbilitiesByColor = expansionAbilitiesByColor;
	creatureGlobalInitData.createColorAbilityMap = createColorAbilityMap;
	creatureGlobalInitData.filterAbilitiesByKeywords = filterAbilitiesByKeywords;
	creatureGlobalInitData.filterAbilitiesByFields = creatureGlobalInitData;
	creatureGlobalInitData.combatEffects = combatEffects;
	creatureGlobalInitData.triggerConditions = triggerConditions;
	creatureGlobalInitData.battlefieldBuffKeywords = battlefieldBuffKeywords;
	creatureGlobalInitData.buildCreatureTypeMap = buildCreatureTypeMap;
	creatureGlobalInitData.creatureTypeMap = creatureTypeMap;
	return creatureGlobalInitData;
}();