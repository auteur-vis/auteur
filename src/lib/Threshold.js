import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Threshold extends GenerationCriteriaBase {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, type="eq", styles={}) {

		super();
		
		this._name = "Threshold";

		this._variable = variable;
		this._val = val;

		this._type = type;

		this._customStyles = styles;

	}

	// Returns set of indices of selected data that match gen criteria
	_aggregator(variable, val, type) {

		let parseVal = this._parseVal;

		function filterFunction(datum, xVar, yVar, xScale, yScale, stats) {
			
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

	// generator for line augmentation
	generateLine(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
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

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
			
			let filtered = data.filter((d, i) => filteredIndices.has(i));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
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

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 1, this._aggregator(this._variable, this._val, this._type));

		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2, this._aggregator(this._variable, this._val, this._type));

		let strokeAug = new Aug(`${this._id}_stroke`, "threshold_stroke", "encoding", undefined,
								   this._generator(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3, this._aggregator(this._variable, this._val, this._type));

		let fillAug = new Aug(`${this._id}_fill`, "threshold_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4, this._aggregator(this._variable, this._val, this._type));

		let labelAug = new Aug(`${this._id}_label`, "threshold_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 5, this._aggregator(this._variable, this._val, this._type));

		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 1, this._aggregator(this._variable, this._val, this._type));

		let regressionAug = new Aug(`${this._id}_regression`, "threshold_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6, this._aggregator(this._variable, this._val, this._type));

		return this._filter([lineAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), labelAug.getSpec(), regressionAug.getSpec()]).sort(this._sort)
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
}