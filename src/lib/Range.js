import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Range extends DataFact {

	// Assume val is [min, max]
	constructor(variable, val, type="include", styles={}) {

		super();

		this._name = "Range";

		this._variable = variable;

		this._min = val[0];
		this._max = val[1];

		this._type = type;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	generateEncoding(variable, min, max, type) {

		return function(datum, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do nothing
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (min > max) {
				return false;
			}

			if (type === "include" && datum[variable] > min && datum[variable] < max) {
				return true;
			} else if (type === "exclude" && (datum[variable] < min || datum[variable] > max)) {
				return true;
			}

			return false;
		}

	}

	// generator for rect/shading augmentation
	generateRect(variable, min, max, type) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render range rect
			if (xVar != variable && yVar != variable) {
				return [];
			}

			if (min > max) {
				return [];
			}

			if (type === "include") {
				if (xVar == variable) {
					let xMin = d3.min([xScale(min), xScale(max)]);
					let width = Math.abs(xScale(max) - xScale(min));
					let yMin = d3.min([yScale.range()[1], yScale.range()[0]]);
					let height = Math.abs(yScale.range()[1] - yScale.range()[0]);

					return [{"x": xMin, "width": width, "y":yMin, "height": height}];
				} else if (yVar == variable) {
					let xMin = d3.min([xScale.range()[0], xScale.range()[1]]);
					let width = Math.abs(xScale.range()[1] - xScale.range()[0]);
					let yMin = d3.min([yScale(min), yScale(max)]);
					let height = Math.abs(yScale(max) - yScale(min));

					return [{"x": xMin, "width": width, "y": yMin, "height": height}];
				}
			} else if (type === "exclude") {
				if (xVar == variable) {
					let xLower = d3.min([xScale.range()[0], xScale.range()[1]]);
					let xMin = d3.min([xScale(min), xScale(max)]);
					let xMax = d3.max([xScale(min), xScale(max)]);
					let xUpper = d3.max([xScale.range()[0], xScale.range()[1]]);

					let lowerWidth = Math.abs(xMin - xLower);
					let upperWidth = Math.abs(xUpper - xMax);

					let yMin = d3.min([yScale.range()[1], yScale.range()[0]]);
					let height = Math.abs(yScale.range()[1] - yScale.range()[0]);

					let lower = {"x": xLower, "width": lowerWidth, "y": yMin, "height": height};
					let upper = {"x": xMax, "width": upperWidth, "y":yMin, "height": height};
					return [lower, upper];
				} else if (yVar == variable) {
					let xMin = d3.min([xScale.range()[0], xScale.range()[1]]);
					let width = Math.abs(xScale.range()[1] - xScale.range()[0]);

					let yLower = d3.min([yScale.range()[0], yScale.range()[1]]);
					let yMin = d3.min([yScale(min), yScale(max)]);
					let yMax = d3.max([yScale(min), yScale(max)]);
					let yUpper = d3.max([yScale.range()[0], yScale.range()[1]]);

					let lowerHeight = Math.abs(yMin - yLower);
					let upperHeight = Math.abs(yUpper - yMax);

					let lower = {"x": xMin, "width": width, "y": yLower, "height": lowerHeight};
					let upper = {"x": xMin, "width": width, "y": yMax, "height": upperHeight};
					return [lower, upper];
				}
			}
			
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (type === "le" || type === "leq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "y": yScale.range()[1], "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(val) + 10, "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${val}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "y": yScale.range()[1], "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(val) + 10, "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${val}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "y": yScale.range()[1], "text": `${variable} ${"equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(val) - 10, "text": `${variable} ${"equal to"} ${val}`}];
				}
			}

			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let rectAug = new Aug(`${this._id}_rect`, "range_rect", "mark", {"mark":"rect"},
								 this.generateRect(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.rect, markStyles.rect), 1);

		let opacityAug = new Aug(`${this._id}_opacity`, "range_opacity", "encoding", undefined,
									this.generateEncoding(this._variable, this._min, this._max, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), 2);

		let fillAug = new Aug(`${this._id}_fill`, "range_fill", "encoding", undefined,
								  this.generateEncoding(this._variable, this._min, this._max, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), 3);

		// let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
		// 						 this.generateText(this._variable, this._val, this._type),
		// 						 this.mergeStyles(this._customStyles.text, markStyles.text), 5);

		return [rectAug.getSpec(), opacityAug.getSpec(), fillAug.getSpec()].sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		// Do not update if max < min
		// if (val[1] < val[0]) {
		// 	if (val[1] < this._max) {
		// 		this._max = this._min;
		// 	} else if (val[1] > this._min) {
		// 		this._min = this._max;
		// 	}
		// 	return
		// }

		this._min = val[0];
		this._max = val[1];
	}

	updateType(type) {
		this._type = type;
	}

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
	}

	// Merge augmentations between multiple data facts
	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
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

	// 				let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.styles, last.rank);
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