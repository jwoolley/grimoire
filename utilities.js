// utility functions
var Utilities = function() {
	var randomNumber = function(max, min) {
		if (!min) {
			min = 0;
		}
		return Math.random() * (max - min) + min;
	};

	var randomInt = function(max, min) {
		if (!min) {
			min = 0;
		}
		return Math.floor(Math.random() * (max - min) + min);
	};

	var randomElement = function(object_) {
		var array = object_;
		if (!Array.isArray(array)) {
			array = [];
			for (property in object_) {
				array.push(object_[property]);
			}
		}
		return array[Math.floor(randomNumber(array.length))];	
	};

	var roundRandom = function(number) {
		if (randomInt(2) == 0) {
			return Math.floor(number);
		} else {
			return Math.ceil(number);
		}
	};

	var nearestHalf = function(number) {
		return Math.round(2 * number) / 2;
	};

	var getStringParamRegex = function(parameter) {
		return new RegExp('\\{' + parameter + '\\}', 'g');
	};

	var getKeyIgnoreCase = function(obj, targetKey) {
		for (key in obj) {
			if ((targetKey || targetKey === 0) && targetKey.toString().toLowerCase() == key.toLowerCase()) {
				return key;		
			}
		}
		return undefined;
	};

	var replaceParameter = function(text, tokenCode, newValue) {
		return text.replace(getStringParamRegex(tokenCode), newValue);
	};
	
	var containsKeyIgnoreCase = function(obj, targetKey) {
		return !(getKeyIgnoreCase === undefined);
	};

	function clone(src) {
		function mixin(dest, source, copyFunc) {
			var name, s, i, empty = {};
			for(name in source){
				// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
				// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
				// don't overwrite it with the toString() method that source inherited from Object.prototype
				s = source[name];
				if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
					dest[name] = copyFunc ? copyFunc(s) : s;
				}
			}
			return dest;
		}

		if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
			// null, undefined, any non-object, or function
			return src;	// anything
		}
		if(src.nodeType && "cloneNode" in src){
			// DOM Node
			return src.cloneNode(true); // Node
		}
		if(src instanceof Date){
			// Date
			return new Date(src.getTime());	// Date
		}
		if(src instanceof RegExp){
			// RegExp
			return new RegExp(src);   // RegExp
		}
		var r, i, l;
		if(src instanceof Array){
			// array
			r = [];
			for(i = 0, l = src.length; i < l; ++i){
				if(i in src){
					r.push(clone(src[i]));
				}
			}
		}else if(dojo.isFunction(src)){
				// function
				r = function(){ return src.apply(this, arguments); };
		}else{
			// generic objects
			r = src.constructor ? new src.constructor() : {};
		}
		return mixin(r, src, clone);

	}

	var cloneObject = function(object) {
		return clone(object);
		//return jQuery.extend(true, {}, obj);
	};

	var cloneArray = function(array) {
		//return jQuery.extend(true, [], array);
		return clone(array);
	};

	var removeElement = function(array, element) {
		if (array.indexOf(element) == -1) {
			return null;
		}
		array.splice(array.indexOf(element), 1);
		return element;
	};

	var arrayDifference = function(array1, array2) {
		var difference = [];
		array1.forEach(function(key) {
		    if (array2.indexOf(key) == -1) {
		        difference.push(key);
		    }
		}, this);
		return difference;
	};

	var arrayUnion = function(array1, array2) {
		return array1.slice().concat(arrayDifference(array2, array1));
	};

	var arrayIntersection = function(array1, array2) {
		return array1.filter(function(n) {
    		return array2.indexOf(n) != -1
		});
	};

	var removeDuplicates = function(array) {
		return array.filter(function(item, index, self) {
			return self.indexOf(item) == index;
		});
	}

	var arrayContains = function(array, element) {
		return array.indexOf(element) !== -1;
	};

	var arrayFromSeparatedList = function(delimitedList, delimiter) {
		var values = [];
		var unescapedList = delimitedList.replace(new RegExp(escape(delimiter), 'g'), delimiter).replace(/\s+/g, ' ');
		if(unescapedList) {
			unescapedList.split(delimiter).forEach(function (value) {
				if (!values.value) {
					values.push(value);
				}
			});
		}
		return values;
	};

	var arrayToString = function(array, separator, formatterCallback) {
		var string = '';
		array.forEach(function(element) {
			if (string.length > 0) {
				string += separator;
			}
			if (formatterCallback) {
				element = formatterCallback(element);
			}
			string += element;
		});
		return string;
	};

	var uppercaseFirstLetter = function(text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	var lowercaseFirstLetter = function(text) {
		return text.charAt(0).toLowerCase() + text.slice(1);
	}	

	var buildProbabilityWheel = function(elementArray, probCallbackOrFieldName) {
		var map =[];
		elementArray.forEach(function(element) {
			map.push({ element: element, probability: typeof probCallbackOrFieldName === 'function' ? probCallbackOrFieldName(element) : element[probCallbackOrFieldName] });
		});
		return map;
	}

	/*
	*	probabilityMap format: [ { element: element, probability: probability }, ... ]
	*/
	var spinProbabilityWheel = function(probabilityMap) {
		var thresholds = [];
		var total = 0;
		probabilityMap.forEach(function(entry, index) {
			total += parseFloat(entry.probability);
			thresholds[index] = total;
		});

		var spinResult = Utilities.randomNumber(total, 0);
		for (var i = 0; i < thresholds.length; i++) {
			if (thresholds[i] >= spinResult) {
				return probabilityMap[i].element;
			}
		};
	}

	function debug(message, logLevel) {
		if (debugEnabled) {
			console.log(message);
		}
	}

	function isDefined(object) {
		return !(typeof object === "undefined");
	}

	/**
	* 	Flattens a map of arrays into a single array.
	* 
	* 	@param object map of arrays
	* 	@return a flattened contatenation of all arrays in the map
	**/
	function flattenArrayMap(object) {
		var flattenedArray = [];
		for (key in object) {
			if (!Array.isArray(object[key])) {
				throw new Error('All properties in object should be arrays. Non-array property found: ' + key);
			}
			flattenedArray = flattenedArray.concat(object[key]);
		}
		return flattenedArray;
	}

	// prototype functions
	String.prototype.format = String.prototype.f = function() {
	    var s = this;
	    var i = arguments.length;

	    while (i--) {
	        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
	    }
	    return s;
	};

	return {
		randomNumber: 			randomNumber,
		randomInt:	  			randomInt,
		randomElement:			randomElement,
		roundRandom:			roundRandom,
		nearestHalf:			nearestHalf,
		getStringParamRegex: 	getStringParamRegex,
		replaceParameter: 		replaceParameter,	
		containsKeyIgnoreCase: 	containsKeyIgnoreCase,
		getKeyIgnoreCase:		getKeyIgnoreCase,
		cloneObject:			cloneObject,
		removeElement:			removeElement,
		arrayDifference:		arrayDifference,
		arrayUnion:				arrayUnion,
		arrayIntersection:		arrayIntersection,	
		removeDuplicates:		removeDuplicates,
		arrayContains:			arrayContains,
		arrayFromSeparatedList:	arrayFromSeparatedList,
		arrayToString:			arrayToString,
		cloneArray: 			cloneArray,
		uppercaseFirstLetter:   uppercaseFirstLetter,
		lowercaseFirstLetter:   lowercaseFirstLetter,
		buildProbabilityWheel:	buildProbabilityWheel,
		spinProbabilityWheel:   spinProbabilityWheel,
		debug:					debug,
		isDefined:				isDefined,
		flattenArrayMap:		flattenArrayMap
	}
}();