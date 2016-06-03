var GeneratorGlobals = function() {	
	function Color(name, code, creatureTypes) {
		return {
			name: name,
			code: code,
			creatureTypes: creatureTypes.slice(0)
		};
	};

	var numberWordMap = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

	var colors = function() {
		var colors = {
			white:  new Color('white', 'W', ['Soldier', 'Spirit', 'Cat']),
			blue:   new Color('blue',  'U', ['Illusion', 'Squid', 'Merfolk']),
			black:  new Color('black', 'B', ['Zombie', 'Rat']),
			red:    new Color('red',   'R', ['Elemental', 'Goblin']),
			green:  new Color('green', 'G', ['Saproling', 'Wolf', 'Beast', 'Elemental'])
		};
		return colors;
	}();

	function ManaType(code, colors, cmcPerSymbol) {
		return {
			code: code,
			colors: colors.slice(0),
			cmcPerSymbol: cmcPerSymbol ? cmcPerSymbol : 1
		};
	};
	var manaTypes = function() {
		var manaTypes = {
			C: 			new ManaType('C', []),
			W: 			new ManaType('W', [colors.white]),
			U: 			new ManaType('U', [colors.blue]),
			B: 			new ManaType('B', [colors.black]),
			R: 			new ManaType('R', [colors.red]),
			G: 			new ManaType('G', [colors.green]),
			WU: 	    new ManaType('WU', [colors.white, colors.blue]),
			WB: 		new ManaType('WB', [colors.white, colors.black]),
			WR: 		new ManaType('WR', [colors.white, colors.red]),
			WG: 		new ManaType('WG', [colors.white, colors.green]),
			UB: 		new ManaType('UB', [colors.blue, colors.black]),
			UR: 		new ManaType('UR', [colors.blue, colors.red]),
			UG: 		new ManaType('UG', [colors.blue, colors.black]),
			BR: 		new ManaType('BR', [colors.green, colors.red]),
			BG: 		new ManaType('BG', [colors.green, colors.black]),
			RG: 		new ManaType('RG', [colors.red, colors.green]),
			W2: 		new ManaType('W2', [colors.white], 2),
			U2: 		new ManaType('U2', [colors.blue], 2),
			B2: 		new ManaType('B2', [colors.black], 2),
			R2: 		new ManaType('R2', [colors.red], 2),
			G2: 		new ManaType('G2', [colors.green], 2),
			PW: 		new ManaType('PW', [colors.white]),
			PU: 		new ManaType('PU', [colors.blue]),
			PB: 		new ManaType('PB', [colors.black]),
			PR: 		new ManaType('PR', [colors.red]),
			PG: 		new ManaType('PG', [colors.green]),			
			/** add phyrexian, snow, etc. mana **/		
		};
		return manaTypes;
	}();

	var colorKeys = {"white": {}, "blue": {}, "black": {}, "red": {}, "green": {}};

	var substitutionCodes = {
		color: 					'COLOR',	
		tokenCreatureType: 		'TOKEN_CREATURE_TYPE',
		creatureAbility: 		'CREATURE_ABILITY',
		cardClass:  			'CARD_CLASS',
		scalableNumber: 		'N',
		countable:          	'COUNTABLE',
		objectProducingAction:  'OBJECT_PRODUCING_ACTION',
		creatureTypeList:     	'CREATURE_TYPE_LIST'
	};

	return {
		parameters : {
			xLiklihood: 0.8
		},
		colors: colors,
		colorKeys: colorKeys,
		numberWordMap: numberWordMap,
		substitutionCodes: substitutionCodes,
		manaTypes: manaTypes
	};	
}();