import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class Threshold extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, type="eq", style) {

		super();
		
		this._name = "Threshold";

		this._variable = variable;
		this._val = val;

		this._type = type;

	}

	generateEncoding(variable, val, type) {

		return function(datum) {
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

			return false;
		}

	}

	generateLine(variable, val) {

		return function(x, y) {
			// If variable not mapped to x or y position, do not render line
			if (x != variable && y != variable) {
				return false;
			}

			if (x == variable) {
				return [{"x": val}];
			} else if (y == variable) {
				return [{"y": val}];
			}
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let newTargetCoord = {};
		newTargetCoord[this.variable] = this.val;

		let lineAug = new Aug(`${this._id}line`, "threshold_line", "mark", {"mark":"line"}, this.generateLine(this._variable, this._val));
		let colorAug = new Aug(`${this._id}color`, "threshold_color", "encoding", {"fill":"#eb4034"}, this.generateEncoding(this._variable, this._val, this._type));

		return [lineAug.getSpec(), colorAug.getSpec()]
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	// returns a list of [Aug Class]
	// intersect(_df) {
	// 	if (_df.name.startsWith("Threshold")) {
	// 		let _indexSelf = new Set(this.generationCriteria().index);
	// 		let _indexOther = new Set(_df.generationCriteria().index);

	// 		let intersect = Array.from([..._indexSelf].filter(i => _indexOther.has(i)));

	// 		let selfTargetCoord = {};
	// 		selfTargetCoord[this.variable] = this.val;

	// 		let otherTargetCoord = {};
	// 		otherTargetCoord[_df.variable] = _df.val;

	// 		let lineAug1 = new Aug("threshold_line", {"data":[selfTargetCoord, selfTargetCoord]}, "line");
	// 		let lineAug2 = new Aug("threshold_line", {"data":[otherTargetCoord, otherTargetCoord]}, "line");

	// 		let colorAug = new Aug("threshold_color", {"index":intersect}, "encoding", {"fill":"red"});

	// 		return [lineAug1.getSpec(), lineAug2.getSpec(), colorAug.getSpec()]
	// 	}
	// }

}