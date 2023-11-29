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
	// val can either be a single value or list of values
	_generator(variable, val, type) {

		let parseVal = this._parseVal;

		return function(datum, xVar, yVar, xScale, yScale, stats) {

			// If no variable or value defined, emphasize entire selection
			if (!variable || !val) {
				return true;
			}

			let parsed;
			// If val is array of values
			if (Array.isArray(val)) {
				parsed = val.map(v => parseVal(variable, v, xVar, yVar, stats));
			} else {
				parsed = parseVal(variable, val, xVar, yVar, stats);
			}

			function isValid(singleVal) {
				
				// If multiple values to emphasize
				if (Array.isArray(parsed)) {
					if (parsed.indexOf(singleVal) >= 0) {
						return true;
					} else {
						return false;
					}
				} else {
					if (singleVal == parsed) {
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
				console.log(datum[variable], isValid(datum[variable]))
				return isValid(datum[variable])
			}

			return false;
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression(variable, val, type) {

		let regression = this._findLineByLeastSquares;
		let regressionFilter = this._generator(variable, val, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {
			
			let filtered = data.filter(d => regressionFilter(d, xVar, yVar, xScale, yScale, stats));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for label augmentation
	generateLabel(variable, val, type, stats) {

		let labelFilter = this._generator(variable, val, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let result;

			result = data.filter(d => labelFilter(d, xVar, yVar, xScale, yScale, stats)).map(d => {
				d.x = xScale(d[xVar]);
				d.y = yScale(d[yVar]) - 15;
				// d.text = `${variable} = ${d[variable]}`;
				d.text = `${d[variable]}`;

				return d
			});

			return result;
			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let strokeAug = new Aug(`${this._id}_stroke`, "emphasis_stroke", "encoding", undefined,
								   this._generator(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 1);

		let labelAug = new Aug(`${this._id}_text`, "emphasis_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "emphasis_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let opacityAug = new Aug(`${this._id}_opacity`, "emphasis_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let regressionAug = new Aug(`${this._id}_regression`, "emphasis_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 5);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._val, this._type);

		return this._filter([strokeAug.getSpec(), labelAug.getSpec(), fillAug.getSpec(), opacityAug.getSpec(), regressionAugs]).sort(this._sort)
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
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

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
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

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
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}

}