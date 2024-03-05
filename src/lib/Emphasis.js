import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Emphasis extends GenerationCriteriaBase {

	// val can either be a single value or list of values
	// type can be "any" or "all", for data in array form
	constructor(variable, val, type="any", styles={}) {

		super();
		
		this._name = "Emphasis";

		this._variable = variable;
		this._val = val;

		this._customStyles = styles;

	}

	// Returns set of indices of selected data that match gen criteria
	_aggregator(variable, val, type) {

		let parseVal = this._parseVal;

		function filterFunction(datum, xVar, yVar, xScale, yScale, stats) {
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
				return isValid(datum[variable])
			}

			return false
		}

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let filteredIndices = new Set();

			for (let i=0; i < data.length; i++) {
				if (filterFunction(data[i], xVar, yVar, xScale, yScale, stats)) {
					filteredIndices.add(i);
				}
			}

			return filteredIndices
			
		}

	}

	// generator for encoding type augmentations
	// val can either be a single value or list of values
	_generator(variable, val, type) {

		return function(index, filteredIndices) {

			return filteredIndices.has(index);
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression(variable, val, type) {

		let regression = this._findLineByLeastSquares;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
			
			let filtered = data.filter((d, i) => filteredIndices.has(i));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for label augmentation
	generateLabel(variable, val, type, stats) {

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {

			let result;

			result = data.filter((d, i) => filteredIndices.has(i)).map(d => {
				d.x = xScale(d[xVar]);
				d.y = yScale(d[yVar]) - 15;
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
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 1, this._aggregator(this._variable, this._val, this._type));

		let labelAug = new Aug(`${this._id}_text`, "emphasis_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 3, this._aggregator(this._variable, this._val, this._type));

		let fillAug = new Aug(`${this._id}_fill`, "emphasis_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4, this._aggregator(this._variable, this._val, this._type));

		let opacityAug = new Aug(`${this._id}_opacity`, "emphasis_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2, this._aggregator(this._variable, this._val, this._type));

		let regressionAug = new Aug(`${this._id}_regression`, "emphasis_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 5, this._aggregator(this._variable, this._val, this._type));


		return this._filter([strokeAug.getSpec(), labelAug.getSpec(), fillAug.getSpec(), opacityAug.getSpec(), regressionAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
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
	symmdiff(drft) {

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
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "symmdiff");
			}
		}

		return all_merged
	}

}