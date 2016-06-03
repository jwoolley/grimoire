var GeneratorFunctions = function() {
	var getMatchingElements = function (list, color, isEnumerable) {
		var matchingElements = [];

		// for each element, indicates if it produces 1 or more countables that are enumerable
		var enumerableMap = {};

		for(elementKey in list) {		
			var element = list[elementKey];
			if (isEnumerable) {
				// exclude all matches that don't have corresponding enumerable countables
				// yes, this is begging for a refactor
				if (!(element.produces in enumerableMap)) {
					enumerableMap[element.produces] = GeneratorUtilities.getMatchingCountables(element.produces, color, true).length > 0;
				}			
			}

			if (element.colors.indexOf(color.code) != -1) {				
				if (!isEnumerable || enumerableMap[element.produces]) {
					matchingElements.push(element);
				}
			}		
		};

		return matchingElements;
	}

	var generatorFunctions = {
		actionBasedEffect: function(card) {
			//TODO: extend this to allow allied colors, etc.
			var matchingActions = getMatchingElements(objectProducingActions, card.color, card.countable.isEnumerable);

			var action = Utilities.randomElement(matchingActions);

			if (action.additionalCost) {
				card.text = 'As an additional cost to cast ~, ' + action.additionalCost + '.\n' + card.text;
				card.cost.additionalCost = action.additionalCost;
			}			
			if (action.text) {	
				card.text = Utilities.replaceParameter(card.text, GeneratorGlobals.substitutionCodes.objectProducingAction, action.text + '.');
			} else {
				card.text = Utilities.replaceParameter(card.text, GeneratorGlobals.substitutionCodes.objectProducingAction, '');
			}
		
			card.countable.dependsOn = [action.produces];
			card.cmc += action.cmc;

			if (action.sorceryAffinity || action.sorceryAffinity === 0) {
				card.sorceryAffinity = action.sorceryAffinity;
			}

			if (action.modAffinity || action.modAffinity === 0) {
				card.modAffinity = action.modAffinity;
			}
			
			if (action.variability) {
				card.variability = action.variability;
			}

			if (action.categories) {
				card.categories =  WordUtilities.mixCategories(card.categories, action.categories);
			}

			GeneratorUtilities.processCountables(card);
		}
	};
	return generatorFunctions;
}();