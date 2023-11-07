import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Emphasis extends DataFact {

	// val can either be a single value or list of values
	// type can be "any" or "all", for data in array form
	constructor(variable, val, type="any", styles={}) {

		super();
		
		this._name = "Emphasis";

		this._variable = variable;
		this._val = val;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	generateEncoding(variable, val, type) {

		return function(datum, xVar, yVar, xScale, yScale) {

			function isValid(singleVal) {
				
				if (Array.isArray(val)) {
					if (val.indexOf(singleVal) >= 0) {
						return true;
					} else {
						return false;
					}
				} else {
					if (singleVal == val) {
						return true;
					}
				}

				return false
			}

			if (Array.isArray(datum)) {
				if (type === "any") {
					return datum.reduce((acc, current) => acc || isValid(current[variable]), false);
				} else {
					return datum.reduce((acc, current) => acc && isValid(current[variable]), true);
				}
			} else {
				return isValid(datum[variable])
			}

			return false;
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {

		return function(data, xVar, yVar, xScale, yScale) {

			let result;

			if (Array.isArray(val)) {

				result = data.filter(d => val.indexOf(d[variable]) >= 0).map(d => {
					d.x = xScale(d[xVar]);
					d.y = yScale(d[yVar]) - 10;
					d.text = `${variable} = ${d[variable]}`;
					return d
				});

			} else {

				result = data.filter(d => val == d[variable]).map(d => {
					d.x = xScale(d[xVar]);
					d.y = yScale(d[yVar]) - 10;
					d.text = `${variable} = ${d[variable]}`;
					return d				
				});
			}

			return result;
			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let strokeAug = new Aug(`${this._id}_stroke`, "emphasis_stroke", "encoding", undefined,
								   this.generateEncoding(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 1);

		let textAug = new Aug(`${this._id}_text`, "emphasis_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 2);

		let fillAug = new Aug(`${this._id}_fill`, "emphasis_fill", "encoding", undefined,
								  this.generateEncoding(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 3);

		let opacityAug = new Aug(`${this._id}_opacity`, "emphasis_opacity", "encoding", undefined,
									this.generateEncoding(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 4);

		return [strokeAug.getSpec(), textAug.getSpec(), fillAug.getSpec(), opacityAug.getSpec()].sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
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
			if (d._name.startsWith("Emphasis")) {

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
			if (d._name.startsWith("Emphasis")) {

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
			if (d._name.startsWith("Emphasis")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}

}