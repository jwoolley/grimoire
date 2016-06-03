var reminderTextFunctions = {
	replaceNumberWords: function(creature, ability, scalarValues) {
		var reminderText = ability.reminderText;
		reminderText = Utilities.replaceParameter(reminderText, GeneratorGlobals.substitutionCodes.scalableNumber, scalarValues[0] == 1 ? 'a' : GeneratorGlobals.numberWordMap[scalarValues[0]]);
		reminderText = Utilities.replaceParameter(reminderText, '0', scalarValues[0] > 1 ? 's' : '');
		return reminderText;		
	}
}

var lockCreatureTypes = function(creature, creatureTypes) {
	if (!creature.subtypes) {
		creature.subtypes = [];
	}
	
	creatureTypes.forEach(function(creatureType) {
		if (creature.subtypes.indexOf(creatureType) === -1) {
			creature.subtypes = creature.subtypes.concat([creatureType]);
		}
	});

	creature.subtypes.locked = true;
}

var functions = {
	base: {
		getText: function(creature, ability, scalarValues) {
			if (!scalarValues) {
				Utilities.debug('No scalar values: ' + ability.keyword);
			}
			return ability.text + ' ' + scalarValues[0];
		},
		getReminderText: function(creature, ability, scalarValues) {
			if (ability.hasAbilityCost) {
				return GeneratorUtilities.encodeManaCost(ability.cost) + ': ' + ability.reminderText;
			} else {
				return Utilities.replaceParameter(ability.reminderText, GeneratorGlobals.substitutionCodes.scalableNumber, scalarValues[0]);
			}
		},
		getFullText: function(creature, ability, scalarValues) {
			if (!ability.isScalable) {
				return ability.text + (ability.cost ? ' ' + GeneratorUtilities.encodeManaCost(ability.cost): '') + ' (' + ability.reminderText + ')' + ability.addon.text;
			} else {
				return getText(ability, creature, scalarValues) + (ability.cost ? ' ' + GeneratorUtilities.encodeManaCost(ability.cost): '') + ' (' + getReminderText(ability, creature, scalarValues) + ')' + ability.addon.text;
			}
		},
		getCostAdjustment: function(creature,  ability, scalarValues) {
			return ability.costAdjustment + (scalarValues ? (scalarValues[0] - ability.variability.baseValue) : 0) * (ability.variability ? ability.variability.variabilityCost : 0);
		},
		getPowerLevelAdjustment: function(creature,  ability, scalarValues) {
			return 0;
		},
		getScalarValues: function(creature, ability) {
			return;
		},
		modifyCard: function(creature, ability, scalarValues) { },
		addonAbility: function(creature, ability, scalarValues) { return { text: '', costAdjustment: 0, complexity: 0 }; },
		getComplexity: function(ability) {
			return ability.complexity ? ability.complexity : 1;
		},
		generateCost: function(creature, ability, scalarValues) {
			throw new Error('Required function generateCost() is not defined for keyword \'' + ability.keyword + '\'');	
		}
	},
	bushido: {
		getScalarValues: function(creature, ability) {
			var min = 1;
			var max = 5;

			var scalar = min;
			for (; scalar < max && Utilities.randomInt(2) !== 0; scalar++) { }
			return [scalar];	
		}
	},
	changeling: {
		modifyCard: function(creature, ability, scalarValues) {
			lockCreatureTypes(creature, ['shapeshifter']);
		}
	},
	devour: {
		getScalarValues: function(creature, ability) {
			var min = 1;
			var max = 3;

			var scalar = min;
			for (; scalar < max && Utilities.randomInt(7) > 5; scalar++) { }
			return [scalar];	
		},
		getReminderText: function(creature, ability, scalarValues) {
			var reminderText = ability.reminderText;
			var howMany = function(number) {
				if (number == 1) {
					return 'that many';
				} else if (number == 2) {
					return 'twice that many';
				} else {
					return GeneratorGlobals.numberWordMap[number] + ' times that many';
				}
			}(scalarValues[0]);
			reminderText = Utilities.replaceParameter(reminderText, '0', howMany);
			reminderText = Utilities.replaceParameter(reminderText, '1', scalarValues[0] > 1 ? 's' : '');
			return reminderText;
		}
	},
	vanishing: {
		getScalarValues: function(creature, ability) {
			var min = Utilities.randomInt(2) + 2;
			var max = 6 - Utilities.randomInt(3);

			var scalar = min;
			for (; scalar < max && Utilities.randomInt(2) !== 0; scalar++) { }
			return [scalar];	
		},
		getReminderText: function(creature, ability, scalarValues) {
			return reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues);
		}	
	},
	amplify: {
		getScalarValues: function(creature, ability) {
			var min = 1;
			var max = 5;

			var scalar = min;
			for (; scalar < max && Utilities.randomInt(2) !== 0; scalar++) { }
			return [scalar];	
		}
	},
	bloodthirst: {
		getScalarValues: function(creature, ability) {
			var min = 1;
			var max = 6;

			var scalar = min;
			for (; scalar < max && Utilities.randomInt(2) !== 0; scalar++) { }
			return [scalar];	
		},
		getReminderText: function(creature, ability, scalarValues) {
			return reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues);
		}	
	},
	graft: {
		getScalarValues: function(creature) {
			return [Math.max(creature.powerToughness.power, creature.powerToughness.toughness)];	
		},
		getReminderText: function(creature, ability, scalarValues) {
			return reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues);
		},
		modifyCard: function(creature, ability, scalarValues) {
			creature.powerToughness.power = 0;
			creature.powerToughness.toughness = 0;
		},
		addonAbility: function(creature, ability, scalarValues) {

			var getAbilityCost = function(creature, ability, scalarValues) {
				var activationCost = Utilities.randomInt(costData.max + 1, costData.min);
				if (Utilities.randomNumber(1) < costData.coloredProbability) {
					return GeneratorUtilities.colorfyCost(activationCost, creature.color);
				} else {
					return new ManaCost({ 'C': activationCost });
				}
			};

			// TODO: determine best place to define this
			var costData = {
				min: 1,
				max: 3,
				coloredProbability: 0.5
			}
			// TODO: add activated abilities (regenerate, untap, etc.)

			var keyword = CreatureUtilities.getRandomKeywordAbility(creature.color.name, CreatureGlobals.battlefieldBuffKeywords);
			var complexity = 1; // should derive from abilty type (triggered, activated, static, global static, etc.) plus ability

			var activationCost = getAbilityCost(creature, ability, scalarValues);
			var text = GeneratorUtilities.encodeManaCost(activationCost) + ': Target creature with a +1/+1 counter on it gains ' + keyword.text + ' until end of turn.';

			return { text: text, costAdjustment: keyword.costAdjustment, complexity: complexity };
		},
	},
	dredge: {
		getScalarValues: function(creature) {
			var min = 2;
			var max = 3;

			var scalar = Utilities.randomInt(max - min + 1) + min;

			if (Utilities.randomInt(4) === 0) {
				scalar = Utilities.randomElement([1, 4, 5, 6]);
			}

			return [scalar];
		},
		getReminderText: function(creature, ability, scalarValues) {
			return reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues).replace('exactly a ', 'exactly one ');
		}
	},	
	soulshift: {
		getScalarValues: function(creature) {
			// TODO: need to use final calculated CMC rather than CMC right now (use a callback?)

			var deviationProbability = .05;
			var scalar = Math.round(creature.cmc - 1);
			if (Utilities.randomNumber(1, 0) < deviationProbability) {
				scalar = Math.round(creature.cmc) + Utilities.randomInt(10 - creature.cmc);
			}
			return [scalar];	
		},
		modifyCard: function(creature, ability, scalarValues) {
			lockCreatureTypes(creature, ['spirit']);
		}
	},
	morph: {
		addonAbility: function(creature, ability, scalarValues) {			

			var morphTrigger = {
				templateFunction: function(abilityText) {				
					return 'When ~ is turned face up, ' + abilityText;	
				},
				meetsRequirements: function(ability, existingAbilities) {
					return true;
		 		}
			};
		
			var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color, [morphTrigger], creature.abilities);

			//TODO make this (Adding two costs) into a util function or ManaCost class function
			GeneratorUtilities.colorfyCost(ability.cost.getCmc() + triggeredAbility.cmc, creature.color);
			return { text: triggeredAbility.text, costAdjustment: ability.costAdjustment, complexity: 1, cost: ability.cost, hasTriggeredAbility: true  };
		},
		generateCost: function(creature, ability, scalarValues) {
			var baseCostModifiers = { min: .75, max: 1 };

			var cost = creature.cmc * Utilities.randomNumber(baseCostModifiers.max, baseCostModifiers.min);
			cost += (ability.addon && ability.addon.cost) ? ability.addon.cost : 0;

			return GeneratorUtilities.colorfyCost(cost, creature.color);		
		}
	},
	unearth: {
		getReminderText: function(creature, ability, scalarValues) {
			return GeneratorUtilities.encodeManaCost(ability.cost) + ': ' + reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues);
		},
		addonAbility: function(creature, ability, scalarValues) {				
			var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color, CreatureGlobals.triggerConditions, creature.abilities);	
			var cost = GeneratorUtilities.colorfyCost(ability.cost.getCmc() + triggeredAbility.cmc, creature.color);
			creature.cmc += triggeredAbility.cmc;
			return { text: triggeredAbility.text, costAdjustment: ability.costAdjustment, complexity: 1, cost: cost, hasTriggeredAbility: true  };
		},
		generateCost: function(creature, ability, scalarValues) {
			var baseCostModifiers = { min: .25, max: 1.25 };

			var cost = creature.cmc * Utilities.randomNumber(baseCostModifiers.max, baseCostModifiers.min);
			cost += (ability.addon && ability.addon.cost) ? ability.addon.cost : 0;

			return GeneratorUtilities.colorfyCost(cost, creature.color);		
		}
	},
	outlast: {
		getReminderText: function(creature, ability, scalarValues) {
			return GeneratorUtilities.encodeManaCost(ability.cost) + ', ' + ability.reminderText;
		},
		addonAbility: function(creature, ability, scalarValues) {
			var addons = {
				staticAbility: function() {
					var keyword = CreatureUtilities.getRandomKeywordAbility(creature.color.name, CreatureGlobals.battlefieldBuffKeywords);	
					return { text: 'Each creature you control with a +1/+1 counter on it has ' + keyword.text + '.', costAdjustment: ability.costAdjustment, complexity: 3, cost: 0 };
				},
				triggeredAbility: function() {
					var conditions = [
						Utilities.cloneObject(CreatureGlobals.triggerConditions.deathTrigger),
						Utilities.cloneObject(CreatureGlobals.triggerConditions.saboteur),
					];
					conditions.forEach(function(condition){
						var originalTemplateFunction = condition.templateFunction;
						condition.templateFunction = function(abilityText) {
							return originalTemplateFunction(abilityText).replace(new RegExp('~'), 'a creature you control with a +1/+1 counter on it').replace(new RegExp('~'), 'that creature');
						}
					});
					var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color, conditions, creature.abilities);
					return { text: triggeredAbility.text, costAdjustment: 0, complexity: 3, cost: ability.cost, hasTriggeredAbility: true };
				}
			};
			return Utilities.randomElement(addons)();
		},	
		generateCost: function(creature, ability, scalarValues) {
			var baseCostModifiers = { min: 1, max: 3 };
			return GeneratorUtilities.colorfyCost(Utilities.randomNumber(baseCostModifiers.max, baseCostModifiers.min), creature.color);		
		}
	},
	monstrosity: {		
		getFullText: function(creature, ability, scalarValues) {
			return GeneratorUtilities.encodeManaCost(ability.cost) + ': ' + getText(ability, creature, scalarValues) + '. (' + getReminderText(ability, creature, scalarValues) + ')' + ability.addon.text;
		},
		getReminderText: function(creature, ability, scalarValues) {
			return GeneratorUtilities.encodeManaCost(ability.cost) + ': ' + reminderTextFunctions.replaceNumberWords(creature, ability, scalarValues);
		},
		getScalarValues: function(creature) {
			return [Utilities.randomInt(Math.max(4, creature.powerToughness.power + 1), 1)];	
		},
		addonAbility: function(creature, ability, scalarValues) {
			var addons = {
				staticAbility: function() {
					var filteredKeywords = {};
					var colorFilteredKeywords = CreatureUtilities.filterExclusions(CreatureGlobals.battlefieldBuffKeywords[creature.color.name], creature.abilities);
					filteredKeywords[creature.color.name] = colorFilteredKeywords;
					filteredKeywords = CreatureUtilities.filterAbilitiesByKeywords(filteredKeywords, 
						creature.abilities.map(function(ability) { return ability.keyword; }), true);
					var keyword = CreatureUtilities.getRandomKeywordAbility(creature.color.name, filteredKeywords);

					//TODO: fix occasional error: cannot read 'text' of undefined (check for keyword === undefined)
					return { text: 'As long as ~ is monstrous, it has ' + keyword.text.replace('target creature you control', 'it') + '.', costAdjustment: 0, complexity: 1, cost: ability.cost + keyword.cmc * 3/4, hasTriggeredAbility: false };
				},
				triggeredAbility: function() {			

				var monstrousTrigger = {
					templateFunction: function(abilityText) {				
						return 'When ~ becomes monstrous, ' + abilityText;	
					},
					meetsRequirements: function(ability, existingAbilities) {
						return true;
			 		}
				};
				
				var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color, [monstrousTrigger], creature.abilities);
					GeneratorUtilities.colorfyCost(ability.cost.getCmc() + triggeredAbility.cmc, creature.color);
					return { text: triggeredAbility.text, costAdjustment: ability.costAdjustment, complexity: 1, cost: ability.cost + triggeredAbility.cmc * 3/4, hasTriggeredAbility: true  };
				}
			};
			return Utilities.randomElement(addons)();
		},	
		generateCost: function(creature, ability, scalarValues) {
			return GeneratorUtilities.colorfyCost(creature.cmc + 1 + scalarValues[0] / 2, creature.color);		
		}
	},
	scavenge: {
		getReminderText: function(creature, ability, scalarValues) {
			return GeneratorUtilities.encodeManaCost(ability.cost) + ': ' + ability.reminderText;
		},
		getCostAdjustment: function(creature,  ability, scalarValues) {
			return Math.max(0, 8 - (ability.cost.getCmc() + creature.cmc));
		},
		generateCost: function(creature, ability, scalarValues) {
			var baseCostModifiers = { min: 3, max: 7 };
			return GeneratorUtilities.colorfyCost(Utilities.randomNumber(baseCostModifiers.max, baseCostModifiers.min), creature.color);		
		}
	},
	evoke: {
		addonAbility: function(creature, ability, scalarValues) {
			return ability.addon;
		},	
		generateCost: function(creature, ability, scalarValues) {
			var addonAbility = function(creature, ability, scalarValues) {		
				var leavesBattlefieldTrigger = {
					templateFunction: function(abilityText) {
						return 'When ~ leaves the battlefield, ' + abilityText;
					},
					meetsRequirements: function(ability) {
						return true;
					}
				};
				var triggeredAbility = CreatureUtilities.getRandomTriggeredEffect(creature.color,
					[Utilities.spinProbabilityWheel([ 
						{ element: CreatureGlobals.triggerConditions.etb, probability: .75 },
						{ element: leavesBattlefieldTrigger, probability: .25 }
					])],
				creature.abilities);
				var text = triggeredAbility.text;
				if (triggeredAbility.sorceryAffinity <= 0.33 &&Utilities.randomNumber(1) > triggeredAbility.sorceryAffinity) {
					text = 'Flash\n' + text;
				}
				return { text: triggeredAbility.text, costAdjustment: triggeredAbility.cmc * Utilities.randomNumber(1, .75), complexity: 1, cost: triggeredAbility.cmc * Utilities.randomNumber(1.25, .75), hasTriggeredAbility: true  };
			};
			ability.addon = addonAbility(creature, ability, scalarValues);
			return GeneratorUtilities.colorfyCost(ability.addon.cost, creature.color)
		},
		modifyCard: function(creature, ability, scalarValues) {
			lockCreatureTypes(creature, ['elemental']);
		}
	},
	bloodrush: {
		getFullText: function(creature, ability, scalarValues) {
			var keyword = Utilities.randomElement(creature.abilities.filter(function(keyword) {
				 //TODO: coby saboteur abilities too? or rather generate saboteur and add to  creature and bloodrush ability
				 //TODO: figure out how to represent this better (isCombatAbility / isAttackerAbility)
				return keyword.isBuff && !keyword.nonBattlefield && keyword !== 'haste';
			}));

			var text = ability.text + ' &mdash; ' +  GeneratorUtilities.encodeManaCost(ability.cost) +
				', Discard ~: '  + ('Target attacking creature gets +{0}/+{1} {2}until end of turn.')
				.format(creature.powerToughness.power, 
					    creature.powerToughness.toughness, 
					    keyword ? 'and gains ' + keyword.text + ' ' : '');

			return text;
		},
		generateCost: function(creature, ability) {
			var cmc = (creature.powerToughness.power / 1.5 + creature.powerToughness.toughness / 4 - 2)
				+ Utilities.randomNumber(2) 
				+ (ability.keyword && ability.keyword.costAdjustment ? ability.keyword.costAdjustment : 0)
			return GeneratorUtilities.colorfyCost(cmc, creature.color);
		}
	}
};

function generateCost(ability, creature, scalarValues) {
	if (!ability.hasAbilityCost) {
		return;
	} else 
	if (functions[ability.keyword] && functions[ability.keyword].generateCost) {
		return functions[ability.keyword].generateCost(creature, ability, scalarValues);
	} else {
		return functions.base.generateCost(creature, ability, scalarValues);
	}
}

function getFullText(creature, ability, scalarValues) {
	if (functions[ability.keyword] && functions[ability.keyword].getFullText) {
		return functions[ability.keyword].getFullText(creature, ability, scalarValues);
	}
	else {
		return functions.base.getFullText(creature, ability, scalarValues);
	}
}

function getText(ability, creature, scalarValues) {
	if (!ability.isScalable) {
		return ability.text;
	}
	else if (functions[ability.keyword] && functions[ability.keyword].getText) {
		return functions[ability.keyword].getText(creature, ability, scalarValues);
	}
	else {
		return functions.base.getText(creature, ability, scalarValues);
	}
}

function getReminderText(ability, creature, scalarValues) {
	if (!ability.isScalable) {
		return ability.reminderText;
	}
	else if (functions[ability.keyword] && functions[ability.keyword].getReminderText) {
		return functions[ability.keyword].getReminderText(creature, ability, scalarValues);
	}
	else {
		return functions.base.getReminderText(creature, ability, scalarValues);
	}
}

function getCostAdjustment(ability, creature, scalarValues) {
	if (functions[ability.keyword] && functions[ability.keyword].getCostAdjustment) {
		return functions[ability.keyword].getCostAdjustment(creature, ability, scalarValues);
	}
	else {
		return functions.base.getCostAdjustment(creature, ability, scalarValues);
	}
}

function getScalarValues(ability, creature) {
	if (functions[ability.keyword] && functions[ability.keyword].getScalarValues) {
		return functions[ability.keyword].getScalarValues(creature, ability);
	}
	else {
		return functions.base.getScalarValues(creature, ability);
	}
}

function modifyCard(creature, ability, scalarValues) {
	if (functions[ability.keyword] && functions[ability.keyword].modifyCard) {
		return functions[ability.keyword].modifyCard(creature, ability, scalarValues);
	}
	else {
		return functions.base.modifyCard(creature, ability, scalarValues);
	}
}

function getAddon(creature, ability, scalarValues, withAddon) {
	if ((withAddon || ability.requiresAddon) && functions[ability.keyword] && functions[ability.keyword].addonAbility) {
		var addon = functions[ability.keyword].addonAbility(creature, ability, scalarValues);
		addon.text = '\n' + addon.text;
		return addon;
	}
	else {
		return functions.base.addonAbility(creature, ability, scalarValues);
	}
}

function getComplexity(ability) {
	if (functions[ability.keyword] && functions[ability.keyword].getComplexity) {
		return functions[ability.keyword].getComplexity(ability);
	}
	else {
		return functions.base.getComplexity(ability);
	}
}

function getRandomKeywordAbility(abilityList, creature, color, withAddon) {
	var ability = Utilities.cloneObject(Utilities.randomElement(abilityList[color.name]));

	if (!ability) {
		return undefined;
	}

	var scalarValues = getScalarValues(ability, creature);
	ability.cost = generateCost(ability, creature, scalarValues);
	ability.addon = getAddon(creature, ability, scalarValues, withAddon);
	modifyCard(creature, ability, scalarValues);
	if (!ability.isScalable) {
		return {
			sourceAbility: ability,
			keyword: ability.keyword,
			text: getFullText(creature, ability, scalarValues),
			costAdjustment: getCostAdjustment(ability, creature, scalarValues) + ability.addon.costAdjustment,
			powerLevelAdjustment: ability.powerLevelAdjustment ? ability.powerLevelAdjustment : 0,
			exclusiveWith: ability.exclusiveWith,
			complexity: getComplexity(ability) + ability.addon.complexity,
			hasTriggeredAbility: ability.addon.hasTriggeredAbility
		}
	} else {
		return {
			sourceAbility: ability,
			keyword: ability.text,
			text: getFullText(creature, ability, scalarValues),
			costAdjustment: getCostAdjustment(ability, creature, scalarValues) + ability.addon.costAdjustment,
			powerLevelAdjustment: getPowerLevelAdjustment(ability, creature, scalarValues),
			exclusiveWith: ability.exclusiveWith,
			complexity:  getComplexity(ability) + ability.addon.complexity,
			hasTriggeredAbility: ability.addon.hasTriggeredAbility
		}
	}
}

function getPowerLevelAdjustment(ability, creature) {
	if (functions[ability.keyword] && functions[ability.keyword].getPowerLevelAdjustment) {
		return functions[ability.keyword].getPowerLevelAdjustment(creature, ability);
	}
	else {
		return functions.base.getPowerLevelAdjustment(creature, ability);
	}
}

CreatureAbilityFunctions = { getRandomKeywordAbility: getRandomKeywordAbility };
