var spellModifiers = {
	flashback : {
		name: 'flashback',		
		getMods: function(card) {
			var costFactors = {
				cmc:  {
					getModifier: function() {
						var min = 1;
						var max = 2;

						return Utilities.randomNumber(max, min);
					}
				},
				flashback:  [
					{ min: 0, max: 1 },   //0
					{ min: 1, max: 6 },   //1
					{ min: 2, max: 6 },   //2
					{ min: 2, max: 6 },   //3
					{ min: 3, max: 6 },   //4
					{ min: 4, max: 7 },   //5
					{ min: 5, max: 7 },   //6
					{ min: 6, max: 7 },   //7
					{ min: 7, max: 8 }    //8				
				]
			};	
			costFactors.flashback["getMin"] = function(cmc) { 
				var cost = Math.round(cmc); 
				if (costFactors.flashback[cost]) { 
					return costFactors.flashback[cost].min; 
				} return cost * 3/4;
			};
			costFactors.flashback["getMax"] = function(cmc) {
				var cost = Math.round(cmc);
				if (costFactors.flashback[cost]) { 
					return costFactors.flashback[cost].max; 
				} 
				return cost * 4/3;
			};
			var flashbackCostColorWeight = .2;

			var cmcModifier = costFactors.cmc.getModifier();
			var flashbackCmc = Math.round(Utilities.randomNumber(costFactors.flashback.getMax(card.cmc + cmcModifier), costFactors.flashback.getMin(card.cmc + cmcModifier)));
			
			var colorfyFunction = card.cost.colorfyFunction ? card.cost.colorfyFunction : GeneratorUtilities.colorfyCostAndEncode;
			var flashbackCost = colorfyFunction(Math.max(1, flashbackCmc), card.color, flashbackCostColorWeight, card.cost.colorfyFunction);

			var modifiers = {
				cost: cmcModifier,
				text: 'Flashback ' + flashbackCost
			};

			return modifiers;
		}		
	},
	cantrip: {
		name: 'cantrip',		
		getMods: function(card) {
			var costFactors = {
				min: 1,
				max: 2
			};

			var modifiers = {
				cost: Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min)),
				text: 'Draw a card.'
			};

			return modifiers;
		}
	},
	storm: {
		name: 'storm',	
		getMods: function(card) {
			var costMultiplier = {
				min: 1.5,
				max: 2.0
			};

			var reminderText = 'When you cast this spell, copy it for each spell cast before it this turn.';

			if (card.text.toLowerCase().match(/\btarget\b/)) {
				reminderText += ' You may choose new targets for the copies.';
			}

			var modifiers = {
				cost: Math.min(costMultiplier.min * 1, card.cmc * (Utilities.nearestHalf(Utilities.randomNumber(costMultiplier.max, costMultiplier.min)) - 1)),
				text: 'Storm',
				reminderText: reminderText
			};

			return modifiers;
		}
	},
	splitSecond: {
		name: 'splitSecond',	
		getMods: function(card) {
			var costFactors = {
				min: .5,
				max: 1
			};

			var modifiers = {
				cost: Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min)),
				text: 'Split second',
				reminderText: 'As long as this spell is on the stack, players can\'t cast spells or activate abilities that aren\'t mana abilities.'
			};

			return modifiers;
		}
	},
	convoke: {
		name: 'convoke',	
		getMods: function(card) {
			var costFactors = {
				min: .5,
				max: 1.0
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min));

			var modifiers = {
				cost: costModifier,
				text: 'Convoke',
				reminderText: 'Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature\'s color.'
			};

			return modifiers;
		},
		colors: [ 'W', 'B', 'R', 'G' ]
	},
	scry: {
		name: 'scry',	
		getMods: function(card) {
			var costFactors = {
				min: .5,
				max: 1.0
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min));

			var modifiers = {
				cost: costModifier,
				text: 'Scry 1.',
				reminderText: 'Look at the top card of your library. You may put that card on the bottom of your library.'
			};

			return modifiers;
		}
	},
	cycling: {
		name: 'cycling',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: .75,
					max: 1.25
				},
				cycling: {
					coloredMin: 1,
					coloredMax: 2,
					colorlessMin: 2,
					colorlessMax: 3,
					coloredLiklihood: .5
				}
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min));

			var cyclingCost;
			if (Utilities.randomNumber(1) < costFactors.cycling.coloredLiklihood) {
				var cyclingCmc = Utilities.randomInt(costFactors.cycling.coloredMax + 1, costFactors.cycling.coloredMin);
				cyclingCost = (cyclingCmc > 1 ? GeneratorUtilities.addParameterTags(cyclingCmc - 1) : '') + GeneratorUtilities.addParameterTags(card.color.code);			
			} else {
				var cyclingCmc = Utilities.randomInt(costFactors.cycling.colorlessMax + 1, costFactors.cycling.colorlessMin);
				cyclingCost = GeneratorUtilities.addParameterTags(cyclingCmc);
			}

			var modifiers = {
				cost: costModifier,
				text: 'Cycling ' + cyclingCost,
				reminderText: cyclingCost + ': Discard this card: Draw a card.'
			};

			return modifiers;
		}
	},
	basicLandcycling: {
		name: 'basicLandcycling',
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: .75,
					max: 1.25
				},
				cycling: {
					min: 2.0,
					max: 2.0
				}
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min));
			var cyclingCmc = Utilities.randomInt(costFactors.cycling.max + 1, costFactors.cycling.min);
			var cyclingCost = (cyclingCmc > 1 ? GeneratorUtilities.addParameterTags(cyclingCmc - 1) : '') + GeneratorUtilities.addParameterTags(card.color.code);			
		
			var modifiers = {
				cost: costModifier,
				text: 'Basic landcycling ' + cyclingCost,
				reminderText: cyclingCost + ': Discard this card: Search your library for a basic land card, reveal it, and put it into your hand. Then shuffle your library.'
			};

			return modifiers;
		}
	},	
	overload: {
		name: 'overload',	
		getMods: function(card) {
			var targetScopes = {
				self: 	  'you control',
				opponent: 'you don\'t control'
			};
			var costFactors = {
				overload: {
					minMultiplier: 1.5,
					maxMultiplier: 2,
					getMultiplier: function(min, max) { 
						return Utilities.randomNumber(costFactors.overload.maxMultiplier, costFactors.overload.minMultiplier);
					},
					colorWeight: .2,
					selfTargetBias: .5
				}
			};
			var targetScope = targetScopes.opponent;
			if (card.baseCard.targetPreference.self && (!card.baseCard.targetPreference.opponent || (Utilities.randomNumber(1) > costFactors.overload.selfTargetBias))) {
				targetScope = targetScopes.self;
			}
			var costIncrease = 0.5;
			if (targetScope == targetScopes.opponent) {
				costIncrease += 1;
			}
			if (card.cmc < 1) {
				costIncrease += (1 - card.cmc);
			}

			card.text = card.text.replace(new RegExp('\\btarget\\screature\\b', 'gi'), 'target creature ' + targetScope)
								 .replace(new RegExp('^target'),'Target');

			var overloadCmc = Math.ceil(costFactors.overload.getMultiplier(costFactors.overload.maxMultiplier, costFactors.overload.minMultiplier) * (card.cmc + costIncrease));
			overloadCost = GeneratorUtilities.colorfyCostAndEncode(overloadCmc, card.color, costFactors.overload.colorWeight);
			var modifiers = {
				cost: 0,
				text: 'Overload ' + overloadCost,
				reminderText: 'You may cast this spell for its overload cost. If you do, change its text by replacing all instances of "target" with "each.".'
			};

			return modifiers;
		},
		colors: [ 'U', 'R' ]		
	},
	conspire: {
		name: 'conspire',	
		getMods: function(card) {
			var costFactors = {
				min: 0,
				max: 0.5
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min));

			var modifiers = {
				cost: costModifier,
				text: 'Conspire',
				reminderText: 'As you cast this spell, you may tap two untapped creatures you control that share a color with it. When you do, copy it and you may choose new targets for the copy.'
			};

			return modifiers;
		}
	},
	buyback: {
		name: 'buyback',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: 0.5,
					max: 1
				},
				buyback: {
					min: 3,
					max: 4,
					colorWeight: .1
				}
			};		

			var costModifier = 0;
			if (card.cmc > 1) {
				costModifier = Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min);
			}

			var buybackCost = GeneratorUtilities.colorfyCostAndEncode(Math.round(Utilities.randomNumber(costFactors.buyback.max, costFactors.buyback.min)), card.color, costFactors.buyback.colorWeight);

			var modifiers = {
				cost: costModifier,
				text: 'Buyback ' + buybackCost,
				reminderText: 'You may pay an additional ' + buybackCost + ' as you cast this spell. If you do, put this card into your hand as it resolves.'
			};

			return modifiers;
		}
	},
	madness: {
		name: 'madness',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: 0,
					max: 1.5
				},
				madness: {
					getMadnessCost: function(cmc, cmcModifier) {
						return Math.min((2.0 - cmcModifier) * cmc, 5);
					},
					colorWeight: .2
				}
			};		

			var costModifier = Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min);
			var madnessCost = Math.round(costFactors.madness.getMadnessCost(card.cmc, costModifier));

			var colorfyFunction = card.cost.colorfyFunction ? card.cost.colorfyFunction : GeneratorUtilities.colorfyCostAndEncode;

			var modifiers = {
				cost: costModifier,
				text: 'Madness ' + colorfyFunction(madnessCost, card.color, costFactors.madness.colorWeight),
				reminderText: 'If you discard this card, you may cast it for its madness cost instead of putting it into your graveyard.'
			};

			return modifiers;
		}
	},
	delve: {
		name: 'delve',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: 2,
					max: 4,
					colorWeight: 0.05
				}
			};		

			var costModifier = Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min);
			card.colorWeight =  costFactors.cmc.colorWeight;

			var modifiers = {
				cost: costModifier,
				text: 'Delve ',
				reminderText: 'Each card you exile from your graveyard while casting this spell pays for {1}.'
			};

			return modifiers;
		},
		colors: [ 'U', 'B', 'G' ]
	},
	transmute: {
		name: 'transmute',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					min: 0.5,
					max: 2.0
				},
				transmute: {
					min: 3,					
					max: 3,
					numColored: 2
				}
			};		

			var costModifier = Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min);
			var transmuteCmc = Math.round(Utilities.randomNumber(costFactors.transmute.max, costFactors.transmute.min));
			var transmuteCost = (transmuteCmc > 1 ? GeneratorUtilities.addParameterTags(transmuteCmc - costFactors.transmute.numColored) : '')
			for (var i = 0; i < costFactors.transmute.numColored; i++) {
				transmuteCost += GeneratorUtilities.addParameterTags(card.color.code);
			}

			var modifiers = {
				cost: costModifier,
				text: 'Transmute ' + transmuteCost,
				reminderText: transmuteCost + ', Discard this card: Search your library for a card with the same converted mana cost as this card, reveal it, and put it into your hand. Then shuffle your library. Transmute only as a sorcery.'
			};

			return modifiers;
		},
		colors: [ 'U', 'B' ]
	},
	cipher: {
		name: 'cipher',	
		getMods: function(card) {
			var costFactors = {
				min: 1.5,
				max: 2.5
			};		

			var costModifier = Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min));

			var modifiers = {
				cost: costModifier,
				text: 'Cipher',
				reminderText: 'Then you may exile this spell card encoded on a creature you control. Whenever that creature deals combat damage to a player, its controller may cast a copy of the encoded card without paying its mana cost.'
			};
			return modifiers;
		},
		colors: [ 'U', 'B' ]		
	},
	phyrexianMana: {
			name: 'phyrexianMana',
			getMods: function(card) {	

				var costFactors = {
					cmc: {
						min: 0.25,
						max: 0.75,
						colorFactor: 0.1			
					}
				}

				var phyrexianManaMap = {};
				var colors = GeneratorGlobals.colors;
				for (color in colors) {
					var phyrexianMana = $.extend({}, colors[color]);
					phyrexianMana.code = 'P' + colors[color].code;
					phyrexianMana.name = 'phyrexian-' + colors[color].name;			
					phyrexianManaMap[color] = phyrexianMana;
				}
				
				var costModifier = Utilities.randomNumber(costFactors.cmc.max, costFactors.cmc.min);
				card.cost.color = phyrexianManaMap[card.color.name];

				var modifiers = {
					cost: costModifier,
					text: '',
					reminderText: GeneratorUtilities.addParameterTags(card.cost.color.code) + 'can be paid with either ' + GeneratorUtilities.addParameterTags(card.color.code) + ' or 2 life.',
				};
				return modifiers;
			}	
		},		
	pact: {
		name: 'pact',
		getMods: function(card) {			
			var costFactors = {
				min: 1.25,
				max: 1.5
			}

			var pactCmc = Math.max(1, card.cmc) * Math.round(Utilities.randomNumber(costFactors.max, costFactors.min));
			var pactCost = GeneratorUtilities.colorfyCostAndEncode(Math.round(pactCmc), card.color, costFactors.colorFactor);
			card.cmc = 0;

			card.cost.adjustCostFunction = function(card) {
				//TODO: store card cost as data structure, so we can nudge cost later as a function (e.g. when upgrading to instant)
				return 0;
			} 

			if (card.type =='Instant' && card.cmc !== 0) {
				card.cost = nudgeCost(card.cmc, instantCostVariability);
			}

			card.nameFunction = function(card) {
				//TODO: clean up to use templates
				// PACT OF {ABSTRACT_NOUN}
				return  generateRandomName(card, ['adjective'], '{ADJECTIVE} Pact');
			}

			var modifiers = {
				cost: 0,
				text: 'At the beginning of your next upkeep, pay ' + pactCost + '. If you don\'t, you lose the game.'
			};
			return modifiers;
		}
	},
	proliferate: {
		name: 'proliferate',	
		getMods: function(card) {
			var costFactors = {
				min: 1.0,
				max: 2.0
			};

			var modifiers = {
				cost: Utilities.nearestHalf(Utilities.randomNumber(costFactors.max, costFactors.min)),
				text: 'Proliferate',
				reminderText: 'You choose any number of permanents and/or players with counters on them, then give each another counter of a kind already there.'
			};

			return modifiers;
		}
	},
	strive: {
		name: 'strive',	
		getMods: function(card) {
			var costFactors = {
				cmc: {
					base: .5,
					minAdditional: 1,
					maxAdditional: 2
				},
				strive: {
					self: {
						min: 1.0,
						max: 1.5
					},
					opponent: {
						min: 2.0,
						max: 2.5				
					},
					neutral: {
						min: 1.0,
						max: 2.0						
					},
					unknown: {
						min: 0.5,
						max: 1.0						
					},			
					adjustStriveCmc: function(cardCmc, striveCmc) {
						if (cardCmc < 3) {
							return striveCmc;
						} else {						
							return Utilities.randomNumber(3/cardCmc, .5) * striveCmc;
						}
					}
				}					
			};		

			var cmcIncrease = costFactors.cmc.base;
			var costRange = costFactors.strive.unknown;
			if (card.baseCard.targetPreference && card.baseCard.targetPreference.self && !card.baseCard.targetPreference.opponent) {
				costRange = costFactors.strive.self;
			} else if (card.baseCard.targetPreference && card.baseCard.targetPreference.opponent && !card.baseCard.targetPreference.self) {
				costRange = costFactors.strive.opponent;				
			} else if (card.baseCard.targetPreference) {
				costRange = costFactors.strive.neutral;		
				cmcIncrease += Utilities.randomNumber(costFactors.cmc.maxAdditional, costFactors.cmc.minAdditional);	
			}

			var striveCost = Utilities.randomNumber(costRange.max, costRange.min) * card.cmc;
			striveCost = Math.max(1, costFactors.strive.adjustStriveCmc(card.cmc, striveCost));

			if (card.text.match(/\b[Tt]arget creature(\s+card)?\b/)) {
				card.text = card.text.replace(/([Tt])arget creature(\s+card)?/, function(p1, p2, p3, offset, string) { 
					var replacement = 'any number of '; 
					if (p3) {
						replacement += 'target creature cards';
					} else {
						replacement += 'target creatures';
						if (p2.charAt(0).toUpperCase() == p2.charAt(0)) { 
							replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1); 
						}
					}
					return replacement;
				}).replace(/gets/, 'get').replace(/gains/, 'gain').replace(/\bits\s+owner's/, 'their owners\'')
					.replace(/\bowners\'\s+hand/, 'owners\' hands').replace(/\bowners\'\s+library/, 'owners\' libraries')
					.replace(/\bcreatures\s+or\splayer\b/, 'creatures or players');
			}

			var modifiers = {
				cost: cmcIncrease,
				text: 'Strive &mdash; ~ costs ' + GeneratorUtilities.colorfyCostAndEncode(Math.round(striveCost), card.color, 0.1) + ' more to cast for each target beyond the first.'
			};

			return modifiers;
		}
	}	
};

var getModifiersByName = function(namesArray) {
	var modifiers = {};
	namesArray.forEach(function(modifierName) {
		for(modifier in spellModifiers) {
			if (spellModifiers[modifier].name == modifierName) {
				modifiers[modifierName] = spellModifiers[modifierName];
			}
		}
	});
	return modifiers;
};

var filterModifiers = function(modifiers, card) {

	//TODO: move these filter checks into the individual modifiers

	var filteredMods = {};
	for (modifier in modifiers) {
		if (!modifiers[modifier].colors || modifiers[modifier].colors.indexOf(card.color.code) != -1) {
			filteredMods[modifier] = modifiers[modifier];
		}
	}

	if (card.type != 'Instant' || !(card.text.match(/\btarget\b/i) || card.text.match(/[-\+]\d+/))) {
		delete(filteredMods.splitSecond)
	}

	// TODO: base off of effect classification instead of sloppy regex matching
	if (card.text.toLowerCase().match('/\bdraw\b/igwi')) {
		delete(filteredMods.cantrip)
	}

	// overload needs a target
	if (!card.baseCard.targetPreference
		|| !card.baseCard.targetPreference.self && !card.baseCard.targetPreference.opponent
		|| !card.text.match(/\btarget\screature\b/i)) {
		delete(filteredMods.overload)
	}

	// TODO: base off of effect classification instead of sloppy regex matching
	if (Math.round(card.cmc) < 3) {
		delete(filteredMods.delve);
	}

	// TODO: base off of effect classification instead of sloppy regex matching
	if (card.type == 'Instant' || card.cmc > 4) {
		delete(filteredMods.cipher);
	}

	if (!card.text.match(/\b[Tt]arget creature\b/ || card.baseCard.targetPreference && card.baseCard.targetPreference.immutable)) {
		delete(filteredMods.strive);
	}

	if (Math.round(card.cmc) < 3) {
		delete(filteredMods.pact);
	}

	if (card.baseCard.copiesDontScale) {
		delete(filteredMods.storm);
		delete(filteredMods.conspire);
	}

	if (card.cost.hasX) {
		delete(filteredMods.storm);
		delete(filteredMods.cipher);
		delete(filteredMods.pact);
	}

	if (card.cost.additionalCost) {
		delete(filteredMods.storm);
		delete(filteredMods.cipher);
		delete(filteredMods.pact);		
	}

    return filteredMods;
}