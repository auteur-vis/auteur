import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class Threshold extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, type="eq", style) {

		super();
		
		this._name = "Threshold";

		this._variable = variable;
		this._val = val;

		this._type = type;

	}

	// generator for encoding type augmentations
	generateEncoding(variable, val, type) {

		return function(datum) {
			if (type === "eq" && datum[variable] == val) {
				return true;
			} else if (type === "le" && datum[variable] < val) {
				return true;
			} else if (type === "leq" && datum[variable] <= val) {
				return true;
			} else if (type === "ge" && datum[variable] > val) {
				return true;
			} else if (type === "geq" && datum[variable] >= val) {
				return true;
			}

			return false;
		}

	}

	// generator for line augmentation
	generateLine(variable, val, type) {

		return function(xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (xVar == variable) {
				return [{"x": xScale(val)}];
			} else if (yVar == variable) {
				return [{"y": yScale(val)}];
			}
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {
		return function(xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (type === "le" || type === "leq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) + 10, "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${val}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) + 10, "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${val}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) - 10, "text": `${variable} ${"equal to"} ${val}`}];
				}
			}

			
		}
 
	}

	_sort(a, b) {
		return a.rank - b.rank;
	}

	// returns a list of [Aug Class]
	getAugs() {

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"}, this.generateLine(this._variable, this._val, this._type), 1);
		let colorAug = new Aug(`${this._id}_color`, "threshold_color", "encoding", {"fill":"#eb4034"}, this.generateEncoding(this._variable, this._val, this._type), 3);
		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", {"opacity":"1"}, this.generateEncoding(this._variable, this._val, this._type), 2);
		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"}, this.generateText(this._variable, this._val, this._type), 4);

		return [opacityAug.getSpec(), lineAug.getSpec(), colorAug.getSpec(), textAug.getSpec()].sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	updateType(type) {
		this._type = type;
	}

	// Merge augmentations between multiple data facts
	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	_mergeAugs(augs1, augs2, intersect_id, merge_by="intersect") {

		let merged = [];

		while (augs1.length > 0) {

			let last = augs1.pop();

			// mark type augmentations are not merged
			if (last.type === "mark") {

				merged.push(last);

			} else {

				let foundIndex = augs2.findIndex(ag => ag.name === last.name && ag.type === "encoding");

				// if no augmentation of the same name is found, add to list without merging
				if (foundIndex < 0) {

					merged.push(last);

				} else {

					let matched_aug = augs2.splice(foundIndex, 1)[0];

					// new id is combination of aug ids
					let split_id = last.id.split('_');
					split_id[0] = intersect_id;
					let new_id = split_id.join('_');

					// combine generators
					function generator(datum) {

						if (merge_by === "intersect" && (last.generator(datum) && matched_aug.generator(datum))) {
							return true;
						} else if (merge_by === "union" && (last.generator(datum) || matched_aug.generator(datum))) {
							return true;
						} else if (merge_by === "difference" && (last.generator(datum) && !matched_aug.generator(datum))) {
							return true;
						} else if (merge_by === "xor" && ((last.generator(datum) || matched_aug.generator(datum)) && !(last.generator(datum) && matched_aug.generator(datum)))) {
							return true;
						}

						return false;

					}

					let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.rank);
					merged.push(new_aug.getSpec());

				}

			}

		}

		return merged.concat(augs2).sort(this._sort)

	}

	// returns a list of [Aug Class]
	intersect(drft) {

		if (drft._name.startsWith("Threshold")) {

			let intersect_id = `${this._id}-${drft._id}`;

			let my_augs = this.getAugs();
			let drft_augs = drft.getAugs();
			let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id);

			return merged_augs
		}
	}

	// returns a list of [Aug Class]
	union(drft) {

		if (drft._name.startsWith("Threshold")) {

			let intersect_id = `${this._id}-${drft._id}`;

			let my_augs = this.getAugs();
			let drft_augs = drft.getAugs();
			let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "union");

			return merged_augs
		}
	}

	// returns a list of [Aug Class]
	difference(drft) {

		if (drft._name.startsWith("Threshold")) {

			let intersect_id = `${this._id}-${drft._id}`;

			let my_augs = this.getAugs();
			let drft_augs = drft.getAugs();
			let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "difference");

			return merged_augs
		}
	}

	// returns a list of [Aug Class]
	xor(drft) {

		if (drft._name.startsWith("Threshold")) {

			let intersect_id = `${this._id}-${drft._id}`;

			let my_augs = this.getAugs();
			let drft_augs = drft.getAugs();
			let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "xor");

			return merged_augs
		}
	}
}