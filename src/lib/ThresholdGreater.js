import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class ThresholdGreater extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(data, variable, val, style) {
		super(data);

		this.name = "ThresholdGreater";

		this.variable = variable;
		this.val = val;

		this.target = this.generationCriteria(variable, val);

		// this.style = style;
	}

	generationCriteria() {
		let newIndex = [];

		for (let i = 0; i < this._data.length; i++) {
			if (this._data[i][this.variable] > this.val) {
				newIndex.push(i);
			}
		}

		return {"index": newIndex};
	}

	getAugs() {

		let newTargetCoord = {};
		newTargetCoord[this.variable] = this.val;

		let lineAug = new Aug("threshold_line", {"data":[newTargetCoord, newTargetCoord]}, "line");
		let colorAug = new Aug("threshold_color", {"index":this.target.index}, "encoding", {"fill":"red"});

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