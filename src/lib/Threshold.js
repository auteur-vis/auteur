import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class ThresholdEquals extends Aug {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(data, variable, val, style) {
		super(data);

		this.name = "ThresholdEquals";
		// this.type = "line";

		this.variable;
		this.val;

		this.target = this.generationCriteria(variable, val);

		this.style = style;
	}

	generationCriteria(variable, val) {
		this.variable = variable;
		this.val = val;

		let newTargetCoord = {};
		newTargetCoord[variable] = val;

		let newIndex = [];

		for (let i = 0; i < this._data.length; i++) {
			if (this._data[i][variable] == val) {
				newIndex.push(i);
			}
		}

		return {"data": [newTargetCoord, newTargetCoord], "index": newIndex};
	}

	getAugs() {
		let lineAug = new Aug()

		return [{"id":this._id,
				 "name":this.name,
				 "target":this.target,
				 "type":"line",
				 "style":this.style},
				 {"id":this._id,
				 "name":this.name,
				 "target":this.target,
				 "type":"encoding",
				 "style":{"fill":"red"}}]
	}

	updateVariable(variable) {
		this.target = this.generationCriteria(variable, this.val);
	}

	updateVal(val) {
		this.target = this.generationCriteria(this.variable, val);
	}

}