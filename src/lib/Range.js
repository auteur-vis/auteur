import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Range extends DataFact {

	// Assume val is [min, max]
	constructor(variable, val, type="closed", styles={}) {

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

			if (type === "closed" && datum[variable] >= min && datum[variable] <= max) {
				return true;
			} else if (type === "open" && datum[variable] > min && datum[variable] < max) {
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

			return [];
			
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
			if (d._name.startsWith("Range")) {

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
			if (d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	xor(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}
	
}