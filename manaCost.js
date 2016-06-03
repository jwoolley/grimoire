var ManaCost = function(costs) {
	var manaTypes = GeneratorGlobals.manaTypes;

	var getCmc = function(costs) {
		var cmc = 0;
		for (manaTypeCode in costs) {
			cmc += costs[manaTypeCode].type.cmcPerSymbol * costs[manaTypeCode].amount;
		}
		return cmc;
	}

	var encodeCost = function(costs) {
		var encodedCost = '';
		for (manaTypeCode in costs) {
			var cost = costs[manaTypeCode];
			if (cost.type === manaTypes.C) {
				encodedCost += GeneratorUtilities.addParameterTags(cost.amount);
			} else {
				encodedCost += Array(cost.amount + 1).join(GeneratorUtilities.addParameterTags(cost.type.code));
			}
		}
		return encodedCost;
	}

	var encodeCost = function(costs) {
		var encodedCost = '';

		for (manaType in manaTypes) {
			if (manaType in costs) {
				var cost = costs[manaType];
				if (cost.type === manaTypes.C) {
					encodedCost += GeneratorUtilities.addParameterTags(cost.amount);
				} else {
					encodedCost += Array(cost.amount + 1).join(GeneratorUtilities.addParameterTags(cost.type.code));
				}
			}
		}

		return encodedCost;
	}	

	this.costs = {};
	for (manaTypeCode in costs) {
		this.costs[manaTypeCode] = { type: manaTypes[manaTypeCode], amount: costs[manaTypeCode] };
	}

	this.getCmc = getCmc.bind(this, this.costs);
	this.encodeCost = encodeCost.bind(this, this.costs);
};