import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class DerivedValues extends DataFact {

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

	// generator for mark augmentation
	generateMark(variable, val, type, calc, fn) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}
	
			let result;

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

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
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
					// console.log(d);
					return d
				});
			}

			return undefined
		}

	}

	generateAxis(variable, val, type, calc, fn) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}
	
			let result;

			if (type === "custom") {
				result = data.map(datum => fn(datum[variable]));
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => datum[variable] + val);
				} else if (calc === "sub") {
					result = data.map(datum => datum[variable] - val);
				} else if (calc === "mult") {
					result = data.map(datum => datum[variable] * val);
				} else if (calc === "div") {
					result = data.map(datum => datum[variable] / val);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => datum[variable] + datum[val]);
				} else if (calc === "sub") {
					result = data.map(datum => datum[variable] - datum[val]);
				} else if (calc === "mult") {
					result = data.map(datum => datum[variable] * datum[val]);
				} else if (calc === "div") {
					result = data.map(datum => datum[variable] / datum[val]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			let resultExtent;

			if (xVar === variable) {
				resultExtent = d3.extent(result);
				// let newXScale = d3.copy()
				// 				  .domain(resultExtent)
				return {"x": resultExtent, "y": yScale.domain()};
			} else if (yVar == variable) {
				resultExtent = d3.extent(result);
				// let newYScale = yScale.copy();
				// newYScale.domain(resultExtent);
				return {"x": xScale.domain(), "y": resultExtent};
			}

			return undefined
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let multipleAug = new Aug(`${this._id}_multiple`, "derived_multiple", "mark", {"mark":undefined},
										 this.generateMark(this._variable, this._val, this._type, this._calc, this._fn), 
										 this.mergeStyles(this._customStyles.multiple, undefined), 1);
		let lineAug = new Aug(`${this._id}_line`, "derived_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type, this._calc, this._fn),
								 this.mergeStyles(this._customStyles.line, markStyles.line), 2);

		return [multipleAug.getSpec(), lineAug.getSpec()].sort(this._sort)
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

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
	}

	// // Merge augmentations between multiple data facts
	// // Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	// _mergeAugs(augs1, augs2, intersect_id, merge_by="intersect") {

	// 	let merged = [];

	// 	while (augs1.length > 0) {

	// 		let last = augs1.pop();

	// 		// mark type augmentations are not merged
	// 		if (last.type === "mark") {

	// 			merged.push(last);

	// 		} else {

	// 			let foundIndex = augs2.findIndex(ag => ag.name === last.name && ag.type === "encoding");

	// 			// if no augmentation of the same name is found, add to list without merging
	// 			if (foundIndex < 0) {

	// 				merged.push(last);

	// 			} else {

	// 				let matched_aug = augs2.splice(foundIndex, 1)[0];

	// 				// new id is combination of aug ids
	// 				let split_id = last.id.split('_');
	// 				split_id[0] = intersect_id;
	// 				let new_id = split_id.join('_');

	// 				// combine generators
	// 				function generator(datum) {

	// 					if (merge_by === "intersect" && (last.generator(datum) && matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "union" && (last.generator(datum) || matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "difference" && (last.generator(datum) && !matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "xor" && ((last.generator(datum) || matched_aug.generator(datum)) && !(last.generator(datum) && matched_aug.generator(datum)))) {
	// 						return true;
	// 					}

	// 					return false;

	// 				}

	// 				let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.rank);
	// 				merged.push(new_aug.getSpec());

	// 			}

	// 		}

	// 	}

	// 	return merged.concat(augs2).sort(this._sort)

	// }

	// // returns a list of [Aug Class]
	// intersect(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id);

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// union(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "union");

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// difference(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "difference");

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// xor(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "xor");

	// 		return merged_augs
	// 	}
	// }
}