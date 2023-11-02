import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Regression extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(styles={}) {

		super();
		
		this._name = "Regression";

		this._customStyles = styles;

	}

	// Following function from https://dracoblue.net/dev/linear-least-squares-in-javascript/
	findLineByLeastSquares(values_x, values_y) {
	    var sum_x = 0;
	    var sum_y = 0;
	    var sum_xy = 0;
	    var sum_xx = 0;
	    var count = 0;

	    /*
	     * We'll use those variables for faster read/write access.
	     */
	    var x = 0;
	    var y = 0;
	    var values_length = values_x.length;

	    if (values_length != values_y.length) {
	        throw new Error('The parameters values_x and values_y need to have same size!');
	    }

	    /*
	     * Nothing to do.
	     */
	    if (values_length === 0) {
	        return [ [], [] ];
	    }

	    /*
	     * Calculate the sum for each of the parts necessary.
	     */
	    for (var v = 0; v < values_length; v++) {
	        x = values_x[v];
	        y = values_y[v];
	        sum_x += x;
	        sum_y += y;
	        sum_xx += x*x;
	        sum_xy += x*y;
	        count++;
	    }

	    /*
	     * Calculate m and b for the formula:
	     * y = x * m + b
	     */
	    var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
	    var b = (sum_y/count) - (m*sum_x)/count;
    
	    let [x1, x2] = d3.extent(values_x);
	    let [y1, y2] = [x1 * m + b, x2 * m + b];

	    return [[x1, y1], [x2, y2]];
	}

	// generator for line augmentation
	generateLine() {

		let regression = this.findLineByLeastSquares;

		return function(data, xVar, yVar, xScale, yScale) {

			let xValues = data.map(d => xScale(d[xVar]));
			let yValues = data.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return [{"x1":coords[0][0], "y1":coords[0][1], "x2":coords[1][0], "y2":coords[1][1]}];
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"},
								 this.generateLine(),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 1);

		return [lineAug.getSpec()].sort(this._sort)
	}

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
	}
}