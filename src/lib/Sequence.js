import * as d3 from "d3";

import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Sequence extends GenerationCriteriaBase {

	// Sequence should be a list of values or a list of lists
	constructor(variable, sequence, styles={}) {

		super();
		
		this._name = "Sequence";

		// variable to search for sequence
		this._variable = variable;
		// the sequence
		this._sequence = sequence;

		this._customStyles = styles;

	}

	// Returns set of indices of selected data that match gen criteria
	_aggregator(variable, sequence) {

		function searchSequence(data, seq, variableSerialized, variableSerializedKeys) {

			if (!variableSerialized[variable]) {
				console.error(`${variable} could not be serialized.`)
				return new Set()
			}

			let sequenceSerialized = new RegExp(seq.map(d => variableSerializedKeys[variable][d]).join(""), 'g');
			let dataMatched = [...variableSerialized[variable].matchAll(sequenceSerialized)];

			let allIndices = new Set();
			for (let match of dataMatched) {
				for (let i = 0; i < seq.length; i++) {
					allIndices.add(match.index + i);
				}
			}

			return allIndices;

		}

		return function(data, xVar, yVar, xScale, yScale, stats, variableSerialized, variableSerializedKeys) {
			if (Array.isArray(sequence[0])) {

				let result = new Set();

				for (let seq of sequence) {
					result = result.union(searchSequence(data, seq, variableSerialized, variableSerializedKeys));
				}

				return result

			} else {
				return searchSequence(data, sequence, variableSerialized, variableSerializedKeys)
			}
		}
	}

	// general generator, usually for encoding type augmentations
	_generator(variable, sequence) {

		return function(index, filteredIndices, xVar, yVar, xScale, yScale, stats) {

			return filteredIndices.has(index);
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let opacityAug = new Aug(`${this._id}_opacity`, "sequence_opacity", "encoding", undefined,
									this._generator(this._variable, this._sequence), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 1, this._aggregator(this._variable, this._sequence));

		let strokeAug = new Aug(`${this._id}_stroke`, "sequence_stroke", "encoding", undefined,
								   this._generator(this._variable, this._sequence),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 2, this._aggregator(this._variable, this._sequence));

		let fillAug = new Aug(`${this._id}_fill`, "sequence_fill", "encoding", undefined,
								  this._generator(this._variable, this._sequence),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 3, this._aggregator(this._variable, this._sequence));

		return this._filter([opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec()]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
		return this;
	}

	updateVal(val) {
		this._val = val;
		return this;
	}

	updateType(type) {
		this._type = type;
		return this;
	}

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
		return this;
	}
}