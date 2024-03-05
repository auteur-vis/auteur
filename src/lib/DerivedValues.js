import { extent as d3extent } from "d3-array";

import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class DerivedValues extends GenerationCriteriaBase {

	// variable: original variable
	// calc: "add", "sub", "mult", "div"
	// val: either a constant or variable name
	// fn: custom function, returns Number
	constructor(variable, val=0, calc="add", fn, styles={}) {

		super();

		this._name = "DerivedData";

		this._variable = variable;

		// keeps track of the type of derived value
		// determines the augmentations later
		this._type;

		if (fn) {
			this._fn = fn;
			this._type = "custom";
		} else {
			this._val = val;
			this._calc = calc;
			this._type = typeof(val) === "number" ? "constant" : "variable";
		}

		this._customStyles = styles;

	}

	_aggregator() {

		return function() {

			return new Set()

		}

	}

	// generator for mark augmentation
	generateMark(variable, val, type, calc, fn) {

		return function(data, filteredIndices, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}

			if (data.length < 1) {
				return undefined;
			}
	
			let result;

			// special condition for line paths
			if (Array.isArray(data[0])) {

				if (type === "custom") {
					result = data.map(lineData => {
						return lineData.map(datum => [fn(datum), datum[variable]]);
					});
				} else if (type === "constant") {
					if (calc === "add") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] + val, datum[variable]]);
						});
					} else if (calc === "sub") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] - val, datum[variable]]);
						});
					} else if (calc === "mult") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] * val, datum[variable]]);
						});
					} else if (calc === "div") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] / val, datum[variable]]);
						});
					} else {
						console.warn(`DerivedValue calc argument ${calc} not recognized.`);
					}
				} else {
					if (calc === "add") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] + datum[val], datum[variable]]);
						});
					} else if (calc === "sub") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] - datum[val], datum[variable]]);
						});
					} else if (calc === "mult") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] * datum[val], datum[variable]]);
						});
					} else if (calc === "div") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] / datum[val], datum[variable]]);
						});
					} else {
						console.warn(`DerivedValue calc argument ${calc} not recognized.`);
					}
				}

				if (!result) {
					return undefined
				}

				if (xVar == variable) {
					return data.map((lineData, i) => {
						return lineData.map((d, j) => {
							d.x = xScale(result[i][j][0]);
							d.deltx = xScale(result[i][j][0]) - xScale(result[i][j][1]);
							return d
						})
					});
				} else if (yVar == variable) {
					return data.map((lineData, i) => {
						return lineData.map((d, j) => {
							d.y = yScale(result[i][j][0]);
							d.delty = yScale(result[i][j][0]) - yScale(result[i][j][1]);
							return d
						})
					});
				}

				return undefined;

			}

			// All other mark/data types
			if (type === "custom") {
				result = data.map(datum => [fn(datum), datum[variable]]);
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + val, datum[variable]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - val, datum[variable]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * val, datum[variable]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / val, datum[variable]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + datum[val], datum[variable]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - datum[val], datum[variable]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * datum[val], datum[variable]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / datum[val], datum[variable]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			if (xVar == variable) {
				return data.map((d, i) => {
					d.x = xScale(result[i][0]);
					d.deltx = xScale(result[i][0]) - xScale(result[i][1]);
					return d
				});
			} else if (yVar == variable) {
				return data.map((d, i) => {
					d.y = yScale(result[i][0]);
					d.delty = yScale(result[i][0]) - yScale(result[i][1]);
					return d
				});
			}

			return undefined
		}

	}

	// generator for mark augmentation
	generateLine(variable, val, type, calc, fn) {

		return function(data, filteredIndices, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}

			if (Array.isArray(data[0])) {
				return undefined;
			}
	
			let result;
			let otherVar = xVar === variable ? yVar : xVar;

			if (type === "custom") {
				result = data.map(datum => [fn(datum), datum[variable], datum[otherVar]]);
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + val, datum[variable], datum[otherVar]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - val, datum[variable], datum[otherVar]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * val, datum[variable], datum[otherVar]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / val, datum[variable], datum[otherVar]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / datum[val], datum[variable], datum[otherVar]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			if (xVar === variable) {
				return data.map((d, i) => {
					d.x1 = xScale(result[i][0]);
					d.x2 = xScale(result[i][1]);
					d.y1 = yScale(result[i][2]);
					d.y2 = yScale(result[i][2]);
					return d
				});
			} else if (yVar == variable) {
				return data.map((d, i) => {
					d.y1 = yScale(result[i][0]);
					d.y2 = yScale(result[i][1]);
					d.x1 = xScale(result[i][2]);
					d.x2 = xScale(result[i][2]);
					return d
				});
			}

			return undefined
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let multipleAug = new Aug(`${this._id}_multiple`, "derived_multiple", "mark", {"mark":undefined},
										 this.generateMark(this._variable, this._val, this._type, this._calc, this._fn), 
										 this.mergeStyles(this._customStyles.multiple, markStyles.multiple), this._selection, 1, this._aggregator());
		let lineAug = new Aug(`${this._id}_line`, "derived_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type, this._calc, this._fn),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 2, this._aggregator());

		return this._filter([multipleAug.getSpec(), lineAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	updateFunction(fn) {
		this._fn = fn;
	}
}