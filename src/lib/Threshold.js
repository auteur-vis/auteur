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

	generateLine(variable, val, type) {

		return function(xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (xVar == variable) {
				return [{"x": xScale(val)}];
			} else if (yVar == variable) {
				return [{"y": yScale(val)}];
			}
		}

	}

	generateText(variable, val, type) {

		return function(xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			if (type === "le" || type === "leq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"le" ? "less than" : "less than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) + 10, "text": `${variable} ${"le" ? "less than" : "less than or equal to"} ${val}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"ge" ? "greater than" : "greater than or equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) + 10, "text": `${variable} ${"ge" ? "greater than" : "greater than or equal to"} ${val}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"x": xScale(val) + 10, "text": `${variable} ${"equal to"} ${val}`}];
				} else if (yVar == variable) {
					return [{"y": yScale(val) - 10, "text": `${variable} ${"equal to"} ${val}`}];
				}
			}

			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"}, this.generateLine(this._variable, this._val, this._type));
		let colorAug = new Aug(`${this._id}_color`, "threshold_color", "encoding", {"fill":"#eb4034"}, this.generateEncoding(this._variable, this._val, this._type));
		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", {"opacity":"1"}, this.generateEncoding(this._variable, this._val, this._type));
		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"}, this.generateText(this._variable, this._val, this._type));

		return [opacityAug.getSpec(), lineAug.getSpec(), colorAug.getSpec(), textAug.getSpec()]
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	// returns a list of [Aug Class]
	intersect(df) {
		if (df.name.startsWith("Threshold")) {
			

			return [lineAug1.getSpec(), lineAug2.getSpec(), colorAug.getSpec()]
		}
	}
}