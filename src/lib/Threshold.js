import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Threshold extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, type="eq", styles={}) {

		super();
		
		this._name = "Threshold";

		this._variable = variable;
		this._val = val;

		this._type = type;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	generateEncoding(variable, val, type) {

		return function(datum, xVar, yVar, xScale, yScale) {
			
			if (Array.isArray(datum)) {
				if (type === "eq") {
					return datum.reduce((acc, current) => acc && current[variable] == val, true);
				} else if (type === "le") {
					return datum.reduce((acc, current) => acc && current[variable] < val, true);
				} else if (type === "leq") {
					return datum.reduce((acc, current) => acc && current[variable] <= val, true);
				} else if (type === "ge") {
					return datum.reduce((acc, current) => acc && current[variable] > val, true);
				} else if (type === "geq") {
					return datum.reduce((acc, current) => acc && current[variable] >= val, true);
				}

			} else {
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
			}

			return false;
		}

	}

	// generator for line augmentation
	generateLine(variable, val, type) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (xVar == variable) {
				return [{"x1": xScale(val), "x2": xScale(val), "y1":yScale.range()[0], "y2":yScale.range()[1]}];
			} else if (yVar == variable) {
				return [{"x1": xScale.range()[0], "x2": xScale.range()[1], "y1": yScale(val), "y2": yScale(val)}];
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

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 1);

		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", undefined,
									this.generateEncoding(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let strokeAug = new Aug(`${this._id}_stroke`, "threshold_stroke", "encoding", undefined,
								   this.generateEncoding(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "threshold_fill", "encoding", undefined,
								  this.generateEncoding(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 5);

		return this._filter([lineAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
		return this;
	}

	updateVal(val) {
		this._val = val;
		return this;
	}

	updateType(type) {
		this._type = type;
		return this;
	}

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
		return this;
	}

	// returns a list of [Aug Class]
	// drft can be a single augmentation or a list of augmentations [aug, aug, ...]
	intersect(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id);
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	union(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW

	// returns a list of [Aug Class]
	// difference(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "difference");

	// 		return merged_augs
	// 	}
	// }

	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW

	// returns a list of [Aug Class]
	xor(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}
}