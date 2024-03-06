import { min as d3min } from "d3-array";

import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Range extends GenerationCriteriaBase {

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

	// Returns set of indices of selected data that match gen criteria
	_aggregator(variable, min, max, type) {

		let parseVal = this._parseVal;

		function filterFunction(datum, xScale, yScale, stats) {

			let parsedMin = parseVal(variable, min, stats);
			let parsedMax = parseVal(variable, max, stats);

			if (parsedMin > parsedMax) {
				return false;
			}

			if (Array.isArray(datum)) {
				if (type === "closed") {
					return datum.reduce((acc, current) => acc && current[variable] >= parsedMin && current[variable] <= parsedMax, true);
				} else if (type === "open") {
					return datum.reduce((acc, current) => acc && current[variable] > parsedMin && current[variable] < parsedMax, true);
				}

			} else {

				if (type === "closed" && datum[variable] >= parsedMin && datum[variable] <= parsedMax) {
					return true;
				} else if (type === "open" && datum[variable] > parsedMin && datum[variable] < parsedMax) {
					return true;
				}

			}

			return false;
		}

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let filteredIndices = new Set();

			for (let i=0; i < data.length; i++) {
				if (filterFunction(data[i], xScale, yScale, stats)) {
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

	// generator for rect/shading augmentation
	generateRect(variable, min, max, type) {

		let parseVal = this._parseVal;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render range rect
			if (xVar != variable && yVar != variable) {
				return [];
			}

			// If no xy-axis specified
			if (!xVar || !yVar) {
				return [];
			}

			let parsedMin = parseVal(variable, min, stats);
			let parsedMax = parseVal(variable, max, stats);

			if (parsedMin > parsedMax) {
				return false;
			}

			if (xVar == variable) {
				let xMin = d3min([xScale(parsedMin), xScale(parsedMax)]);
				let width = Math.abs(xScale(parsedMax) - xScale(parsedMin));
				let yMin = d3min([yScale.range()[1], yScale.range()[0]]);
				let height = Math.abs(yScale.range()[1] - yScale.range()[0]);

				return [{"x": xMin, "width": width, "y":yMin, "height": height}];
			} else if (yVar == variable) {
				let xMin = d3min([xScale.range()[0], xScale.range()[1]]);
				let width = Math.abs(xScale.range()[1] - xScale.range()[0]);
				let yMin = d3min([yScale(parsedMin), yScale(parsedMax)]);
				let height = Math.abs(yScale(parsedMax) - yScale(parsedMin));

				return [{"x": xMin, "width": width, "y": yMin, "height": height}];
			}

			return [];
			
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression(variable, val, type) {

		let regression = this._findLineByLeastSquares;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {

			// If no xy-axis specified
			if (!xVar || !yVar) {
				return;
			}
			
			let filtered = data.filter((d, i) => filteredIndices.has(i));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for text augmentation
	generateText(variable, min, max, type) {

		let parseVal = this._parseVal;

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return;
			}

			// If no xy-axis specified
			if (!xVar || !yVar) {
				return;
			}

			let parsedMin = parseVal(variable, min, stats);
			let parsedMax = parseVal(variable, max, stats);

			if (parsedMin > parsedMax) {
				return;
			}

			if (xVar == variable) {
				return [{"x": xScale(parsedMin) + 5, "y": yScale.range()[1], "text": `  ${parsedMin} ${min != parsedMin ? "("+min+")" : ""}`},
						{"x": xScale(parsedMax) + 5, "y": yScale.range()[1], "text": `  ${parsedMax} ${max != parsedMax ? "("+max+")" : ""}`}];
			} else if (yVar == variable) {
				return [{"x": xScale.range()[0], "y": yScale(parsedMin) - 5, "text": `  ${parsedMin} ${min != parsedMin ? "("+min+")" : ""}`},
						{"x": xScale.range()[0], "y": yScale(parsedMax) + 5, "text": `  ${parsedMax} ${max != parsedMax ? "("+max+")" : ""}`}];
			}
			
		}
 
	}

	// generator for label augmentation
	generateLabel(variable, val, type, stats) {

		return function(data, filteredIndices, xVar, yVar, xScale, yScale, stats) {

			// If no xy-axis specified
			if (!xVar || !yVar) {
				return;
			}

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

		let rectAug = new Aug(`${this._id}_rect`, "range_rect", "mark", {"mark":"rect"},
								 this.generateRect(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.rect, markStyles.rect), this._selection, 1, this._aggregator(this._variable, this._min, this._max, this._type));

		let opacityAug = new Aug(`${this._id}_opacity`, "range_opacity", "encoding", undefined,
									this._generator(this._variable, this._min, this._max, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2, this._aggregator(this._variable, this._min, this._max, this._type));

		let strokeAug = new Aug(`${this._id}_stroke`, "range_stroke", "encoding", undefined,
								   this._generator(this._variable, this._min, this._max, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3, this._aggregator(this._variable, this._min, this._max, this._type));

		let fillAug = new Aug(`${this._id}_fill`, "range_fill", "encoding", undefined,
								  this._generator(this._variable, this._min, this._max, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4, this._aggregator(this._variable, this._min, this._max, this._type));

		let textAug = new Aug(`${this._id}_text`, "range_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 1, this._aggregator(this._variable, this._min, this._max, this._type));

		let labelAug = new Aug(`${this._id}_label`, "range_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 5, this._aggregator(this._variable, this._min, this._max, this._type));

		let regressionAug = new Aug(`${this._id}_regression`, "range_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6, this._aggregator(this._variable, this._min, this._max, this._type));

		return this._filter([rectAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), labelAug.getSpec(), regressionAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
		return this;
	}

	updateVal(val) {
		this._min = val[0];
		this._max = val[1];
		return this;
	}

	updateType(type) {
		this._type = type;
		return this;
	}
	
}