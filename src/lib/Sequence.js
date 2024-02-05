import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Sequence extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, styles={}) {

		super();
		
		this._name = "Sequence";

		// variable to search for sequence
		this._variable = variable;
		// the sequence
		this._val = val;

		// this._type = type;

		this._customStyles = styles;

	}

	// general generator, usually for encoding type augmentations
	_generator(variable, val, type) {

		let parseVal = this._parseVal;

		return function(datum, xVar, yVar, xScale, yScale, stats) {

			let parsed = parseVal(variable, val, xVar, yVar, stats);
			
			if (Array.isArray(datum)) {
				if (type === "eq") {
					return datum.reduce((acc, current) => acc && current[variable] == parsed, true);
				} else if (type === "le") {
					return datum.reduce((acc, current) => acc && current[variable] < parsed, true);
				} else if (type === "leq") {
					return datum.reduce((acc, current) => acc && current[variable] <= parsed, true);
				} else if (type === "ge") {
					return datum.reduce((acc, current) => acc && current[variable] > parsed, true);
				} else if (type === "geq") {
					return datum.reduce((acc, current) => acc && current[variable] >= parsed, true);
				}

			} else {
				if (type === "eq" && datum[variable] == parsed) {
					return true;
				} else if (type === "le" && datum[variable] < parsed) {
					return true;
				} else if (type === "leq" && datum[variable] <= parsed) {
					return true;
				} else if (type === "ge" && datum[variable] > parsed) {
					return true;
				} else if (type === "geq" && datum[variable] >= parsed) {
					return true;
				}
			}

			return false;
		}

	}

	// generator for line augmentation
	generateLine(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsed = parseVal(variable, val, xVar, yVar, stats);

			if (xVar == variable) {
				return [{"x1": xScale(parsed), "x2": xScale(parsed), "y1":yScale.range()[0], "y2":yScale.range()[1]}];
			} else if (yVar == variable) {
				return [{"x1": xScale.range()[0], "x2": xScale.range()[1], "y1": yScale(parsed), "y2": yScale(parsed)}];
			}
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

	// generator for text augmentation
	generateText(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsed = parseVal(variable, val, xVar, yVar, stats);

			if (type === "le" || type === "leq") {
				if (xVar == variable) {
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${"le" == type ? "<" : "<="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) + 10, "text": `  ${"le" == type ? "<" : "<="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${"ge" == type ? ">" : ">="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) - 10, "text": `  ${"ge" == type ? ">" : ">="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) - 10, "text": `  ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			}

			
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

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 1);

		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let strokeAug = new Aug(`${this._id}_stroke`, "threshold_stroke", "encoding", undefined,
								   this._generator(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "threshold_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let labelAug = new Aug(`${this._id}_label`, "threshold_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 5);

		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 1);

		let regressionAug = new Aug(`${this._id}_regression`, "threshold_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6);

		let labelAugs = labelAug.getSpec();
		labelAugs._filter = this._generator(this._variable, this._val, this._type);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._val, this._type);

		return this._filter([lineAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), labelAugs, regressionAugs]).sort(this._sort)
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
	// criteria can be a single augmentation or a list of augmentations [aug, aug, ...]
	intersect(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id);
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	union(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	xor(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}
}