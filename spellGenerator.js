var SpellGenerator = function(creatureAbilities, GeneratorGlobals) {
	var effectIdOffset = 100;

	// initialization

	var programData = {};
	var init = function(initData) {
		programData.spellMatrix = [];
		initData.spellMatrices.forEach(function(spellMatrix) {
			spellMatrix.forEach(function (spellEffect) {
				addNewSpellEffect(programData.spellMatrix, spellEffect);
			});
		});
		programData.effectsMap = generateEffectIds(programData.spellMatrix);
		GeneratorUtilities.buildColorAbilityMap(GeneratorGlobals.colorKeys, creatureAbilities);
		//WordUtilities.initializeWordCategories(wordList);
	}

	var addNewSpellEffect = function(spellMatrix, spellEffect) {
		spellMatrix.push(spellEffect);
	}


	var nudgeCost = function(cost, costVariability) {
		var differentialCost = 0;
		var likelihood = costVariability.likelihood;

		if (Utilities.nearestHalf(cost) < 1) {
			likelihood += .25;
		}

		if (Utilities.randomNumber(1) < likelihood) {
			cost += Utilities.randomNumber(costVariability.max, costVariability.min);
		}

		return cost;
	};

	var determineSpellType = function(card) {
		var instantCostVariability = {
			min: .5,
			max: 1.4,
			likelihood: 1
		};

		var sorceryAffinity = card.sorceryAffinity || card.sorceryAffinity === 0 ? card.sorceryAffinity : card.baseCard.sorceryAffinity;

		if (Utilities.randomNumber(1) > sorceryAffinity) {
			card.type = 'Instant';
		} else {
			card.type = 'Sorcery';
		}
		return card;
	};

	var getRandomBaseSpellEffect = function(spellMatrix) {
		if (!spellMatrix) {
			spellMatrix = programData.spellMatrix;
		}
		return GeneratorUtilities.getRandomSpellEffect(spellMatrix);
	};

	function getRandomSpellEffect(color, spellMatrix) {
		// change to constructor that only copies relevant bits
		var retries = 0;
		var maxRetries = 99;
		var baseCard = getRandomBaseSpellEffect(spellMatrix);	
		while (color && baseCard.colors.indexOf(color.code) == -1 && retries < maxRetries) {
			baseCard = getRandomBaseSpellEffect(spellMatrix);
			retries++;
		}
		var card = {};
		card.color = color && baseCard.colors.indexOf(color.code) != -1 ? color: GeneratorUtilities.getColorByCode(Utilities.randomElement(baseCard.colors));
		card.cost = card.cost || {};
		card.cost.color = card.color;

		// TODO: once multicolor supported, add all the colors
		card.categories =  baseCard.categories;
		$.extend( true, card, { categories: { color: [card.color.code] } } );

		card.text = baseCard.ability;
		if (baseCard.countable) {
			card.countable =  $.extend({}, baseCard.countable);
		}
		card.cmc = baseCard.cmc;
		card.modAffinity = baseCard.modAffinity;	
		card.colorWeight = baseCard.colorWeight;		
		card.effectId = baseCard.effectId;
		card.baseCard = baseCard;

		if (card.baseCard.generatorFunction) {
			GeneratorFunctions[card.baseCard.generatorFunction](card);
		}

		determineSpellType(card);
		GeneratorUtilities.processCountables(card);
		
		return card;
	};

	var adjustCost = function(card) {
		if (card.cost.adjustCostFunction) {
			return card.cost.adjustCostFunction();
		}

		var costVariability = {
			min: -1,
			max: 1,
			likelihood: 0
		};

		var instantCostVariability = {
			min: .5,
			max: 1.4,
			likelihood: 1
		};

		// nudge cards without specific variability
		if (!card.baseCard.text == card.text) {
			card.cmc = nudgeCost(card.cmc, costVariability);
		}

		if (card.type =='Instant') {
			card.cmc = nudgeCost(card.cmc, instantCostVariability);
		}

		return card;
	};

	var addSpellModifiers = function(card, modifierFunctions) {
		for (var i = 0; i < modifierFunctions.length; i++) {
			var modifier = modifierFunctions[i](card);
			card.cmc += modifier.cost;
			card.text += '\n' + modifier.text;
			card.reminderText = modifier.reminderText;
		}
		return card;
	};

	// if spell cmc < 1, always add a modifier (otherwise it's not a full spell)
	var addSpellModifierRandom = function(card, modifiers, defaultModFactor) {
		var modFactor = defaultModFactor;
		if (card.cmc < 1) {
			modFactor = 1;
		} else if (card.modAffinity) {
			modFactor = card.modAffinity;
		}
		if (Utilities.randomNumber(1) < modFactor) {
			var filteredMods =  filterModifiers(modifiers, card);
			if (Object.keys(filteredMods).length > 0) {
				addSpellModifiers(card, [Utilities.randomElement(filteredMods).getMods]);
			}
		}
	};

	var generateEffectIds = function(effectsArray) {
		var effectsMap = {};
		effectsArray.forEach(function(effect, index) {
			var id = index + effectIdOffset;
			effectsMap[id] = effect;
			effect.effectId = id;		
		});
		return effectsMap;
	};

	var getEffectById = function(effectId, effectsMap) {
		if (!effectsMap) {
			effectsMap = programData.effectsMap;
		}
		return effectsMap[effectId];
	};

	function listEffectIds() {
		Utilities.debug('Effect Ids:');
		for (effect in programData.effectsMap) {
			Utilies.debug(effect + ': ' + programData.effectsMap[effect].ability);
		}
	};

	/*
		example: 
		filters:
			{
				colors: [ "U", "B" ]
				modifiers: [ "flashback" ],
				effectIds: [ 135, 201, 212 ]
			}
	*/
	function generateSpell(filters) {
		var defaultModFactor = .3;
		var defaultColorDiscountFactor = .5;


		//TODO extract & make reusable for creatureGenerator, etc.
		var _colors = [];
		if (filters && filters.colors) {
			_colors = filters.colors;
		}
	 	var color = filters.colors ? GeneratorUtilities.getColorByCode([Utilities.randomElement(_colors).toUpperCase()]) : undefined;

	 	// list of base spell effects to use. if not speified in filter, use the full list
	 	var spellMatrix = [];
	 	if (filters && filters.effectIds) {
	 		filters.effectIds.forEach(function(effectId) {
	 			if (programData.effectsMap[effectId]) {
	 				spellMatrix.push(programData.effectsMap[effectId]);
	 			}
	 		});
	 	}
	 	if (spellMatrix.length == 0) {
	 		spellMatrix = programData.spellMatrix;
	 	}

		var card = getRandomSpellEffect(color, spellMatrix);

		var modifiers = {};
		if (filters && filters.modifiers) {
			modifiers = getModifiersByName(filters.modifiers);
		}
		if (Object.keys(modifiers).length > 0) {
			card.modAffinity = 1;
		}	else {
			modifiers = spellModifiers;
		}
		GeneratorUtilities.calculateScalableValues(card);		
		addSpellModifierRandom(card, modifiers, defaultModFactor);
		adjustCost(card);
		
		var colorfyFunction = card.cost.colorfyFunction ? card.cost.colorfyFunction : GeneratorUtilities.colorfyCostAndEncode;
		card.cost = colorfyFunction(card.cmc, card.cost.color, card.baseCard.colorDiscountFactor || card.baseCard.colorDiscountFactor === 0 ? card.baseCard.colorDiscountFactor : defaultColorDiscountFactor);

		GeneratorUtilities.replaceEffectParameters(card);
		card.text = GeneratorUtilities.textFixHacks(card.text, true);

		delete(card.cmc);
		delete(card.baseCard);

		return card;
	};

	return {
		init: init,
		generateSpell: generateSpell,
		getEffectById: getEffectById,
		nudgeCost: nudgeCost,
		listEffectIds: listEffectIds,
		addNewSpellEffect: function(spellEffect) {
			return addNewSpellEffect(programData.spellMatrix, spellEffect);
		}
	}
};