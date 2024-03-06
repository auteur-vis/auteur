import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

// Just add data
export default class LocalData extends GenerationCriteriaBase {

	constructor(val, styles={}) {

		super();

		this._name = "LocalData";

		this._local = val;

		this._customStyles = styles;

	}

	_aggregator() {

		return function() {

			return new Set()

		}

	}

	// generator for mark augmentation
	generateMark(local=[]) {
		
		return function(data, filteredIndices, xVar, yVar, xScale, yScale) {

			// If no xy-axis specified
			if (!xVar || !yVar) {
				return;
			}
			
			return(local.map((ld, i) => {

				// If no xy-axis specified
				if (!ld[xVar]) {
					console.error(`LocalData missing variable ${xVar} on row ${i}`)
					return;
				}

				// If no xy-axis specified
				if (!ld[yVar]) {
					console.error(`LocalData missing variable ${yVar} on row ${i}`)
					return;
				}

				ld.x = xScale(ld[xVar]);
				ld.y = yScale(ld[yVar]);
				return ld
			}))

		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let markAug = new Aug(`${this._id}_mark`, "local_mark", "mark", {"mark":undefined},
										 this.generateMark(this._local), 
										 this.mergeStyles(this._customStyles.mark, undefined), this._selection, 1, this._aggregator());

		return this._filter([markAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
		return this;
	}

	updateVal(val) {
		this._val = val;
		return this;
	}

	updateFunction(fn) {
		this._fn = fn;
		return this;
	}
}