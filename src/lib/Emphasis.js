import Aug from "./Aug.js";
import DataFact from "./DataFact.js"

export default class Emphasis extends DataFact {

	// - val {number, stat, fn}
	// 		val: user specified, any valid value in data domain
	// 		stat: automatically computed, min, max, mean, median, or mode
	// 		fn: user specified function, takes 1D array as input, returns valid value in data domain
	constructor(data, variable, val, style) {
		super(data);

		this.name = "Emphasis";

		this.variable = variable;
		this._type;
		this.emph;

		this.updateEmph(val);

		this.target = this.generationCriteria();

		// this.style = style;
	}

	generationCriteria() {
		let newIndex = [];

		for (let i = 0; i < this._data.length; i++) {
			if (this._data[i][this.variable] == this.emph) {
				newIndex.push(i);
			}
		}

		return {"index": newIndex};
	}

	// returns a list of [Aug Class]
	getAugs() {
		let colorAug = new Aug("threshold_color", {"index":this.target.index}, "encoding", {"fill":"red"});
		return [colorAug.getSpec()]
	}

	updateEmph(val) {
		if (!val) {
			console.warn("Emphasis augmentation expects emphasized value to be provided");
		} else if (val.val) {
			this._type = "val";
			this.emph = val.val;
		} else if (val.stat) {
			this._type = "stat";

			let attr_row = data.map(d => d[variable]);

			if (val.stat === "min") {
				this.emph = Math.min(...attr_row);
			} else if (val.stat === "max") {
				this.emph = Math.max(...attr_row);
			} else if (val.stat === "mean") {
				this.emph = attr_row.reduce((a, b) => a + b) / attr_row.length;
			} else if (val.stat === "median") {
				let midpoint = Math.floor(attr_row.length / 2);

				attr_row.sort((a, b) => a - b);
				this.emph = attr_row.length % 2 === 1 ? attr_row[midpoint] : (attr_row[midpoint] + attr_row[midpoint - 1]) / 2;
			} else if (val.stat === "mode") {

				let counts = {};

				for (let v of attr_row) {
					if (!(v in counts)) {
						counts[v] = 1;
					} else {
						counts[v] += 1;
					}
				}

				let max_count = 0;
				let max_value;

				for (let vi of Object.keys(counts)) {
					if (counts[vi] > max_count) {
						max_count = counts[vi];
						max_value = vi;
					}
				}

				this.emph = max_value;
			} else {
				console.warn("Unrecognized stat, only 'min', 'max', 'mean', 'median', and 'mode' recognized");
			}

		} else if (val.fn) {
			this._type = "fn"

			let attr_row = data.map(d => d[variable]);
			this.emph = val.fn(attr_row);
		} else {
			console.warn("Emphasized value must be provided as 'val', 'stat' or 'fn'");
		}

		this.target = this.generationCriteria();
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