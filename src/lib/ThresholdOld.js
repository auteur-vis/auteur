import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class Threshold extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(data, selector, variable, val, type="eq", style) {
		super(data);

		// console.log(d3.select(selector));

		this.name = "Threshold";

		this.variable = variable;
		this.val = val;

		this._type = type;

		this.target = this.generationCriteria();

		// this.style = style;
	}

	generationCriteria() {
		// this.variable = variable;
		// this.val = val;

		let newIndex = [];

		for (let i = 0; i < this._data.length; i++) {
			if (this._type === "eq" && this._data[i][this.variable] == this.val) {
				newIndex.push(i);
			} else if (this._type === "le" && this._data[i][this.variable] < this.val) {
				newIndex.push(i);
			} else if (this._type === "leq" && this._data[i][this.variable] <= this.val) {
				newIndex.push(i);
			} else if (this._type === "ge" && this._data[i][this.variable] > this.val) {
				newIndex.push(i);
			} else if (this._type === "geq" && this._data[i][this.variable] >= this.val) {
				newIndex.push(i);
			}
		}

		return {"index": newIndex};
	}

	// returns a list of [Aug Class]
	getAugs() {

		let newTargetCoord = {};
		newTargetCoord[this.variable] = this.val;

		let lineAug = new Aug("threshold_line", {"data":[newTargetCoord, newTargetCoord]}, "line");
		let colorAug = new Aug("threshold_color", {"index":this.target.index}, "encoding", {"fill":"#eb4034"});

		return [lineAug.getSpec(), colorAug.getSpec()]
	}

	updateVariable(variable) {
		this.variable = variable;
		this.target = this.generationCriteria();
	}

	updateVal(val) {
		this.val = val;
		this.target = this.generationCriteria();
	}

	// returns a list of [Aug Class]
	intersect(_df) {
		if (_df.name.startsWith("Threshold")) {
			let _indexSelf = new Set(this.generationCriteria().index);
			let _indexOther = new Set(_df.generationCriteria().index);

			let intersect = Array.from([..._indexSelf].filter(i => _indexOther.has(i)));

			let selfTargetCoord = {};
			selfTargetCoord[this.variable] = this.val;

			let otherTargetCoord = {};
			otherTargetCoord[_df.variable] = _df.val;

			let lineAug1 = new Aug("threshold_line", {"data":[selfTargetCoord, selfTargetCoord]}, "line");
			let lineAug2 = new Aug("threshold_line", {"data":[otherTargetCoord, otherTargetCoord]}, "line");

			let colorAug = new Aug("threshold_color", {"index":intersect}, "encoding", {"fill":"red"});

			return [lineAug1.getSpec(), lineAug2.getSpec(), colorAug.getSpec()]
		}
	}

}