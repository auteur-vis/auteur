import { extent as d3extent } from "d3-array";

import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Regression extends GenerationCriteriaBase {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(styles={}) {

		super();
		
		this._name = "Regression";

		this._customStyles = styles;

	}

	_aggregator() {

		return function(data) {
			return new Set(data.map((d, i) => i))
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression() {

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

	// returns a list of [Aug Class]
	getAugs() {

		let regressionAug = new Aug(`${this._id}_regression`, "regression_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(),
								 this.mergeStyles(this._customStyles.regression, markStyles.regression), this._selection, 1, this._aggregator());

		return this._filter([regressionAug.getSpec()]).sort(this._sort)
	}

}