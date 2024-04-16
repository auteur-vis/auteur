import * as d3 from "d3";

import Aug from "./Aug.js";
import GenerationCriteriaBase from "./GenerationCriteriaBase.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Sequence extends GenerationCriteriaBase {

	// Sequence should be a list of values or a list of lists
	// type can either be "index" or "directed" or "undirected"
	constructor(variable, sequence, type="index", styles={}) {

		super();
		
		this._name = "Sequence";

		// variable to search for sequence
		this._variable = variable;
		// the sequence
		this._sequence = sequence;

		this._type = type;

		this._customStyles = styles;

	}

	// Returns set of indices of selected data that match gen criteria
	_aggregator(variable, sequence, type) {

		function _getLinksDirected(data) {

			let result = {};

			for (let i=0; i<data.length; i++) {

				let d = data[i];

				if (d.source && d.target) {
					let sourceVar = d.source[variable];
					let targetVar = d.target[variable];

					if (result[sourceVar]) {
						result[sourceVar].push(targetVar);
						result[sourceVar]["_$id$"].push(i);
					} else {
						result[sourceVar] = [targetVar];
						result[sourceVar]["_$id$"] = [i];
					}
				}
			}

			return result

		}

		function _getLinksUndirected(data) {

			let result = {};

			for (let i=0; i<data.length; i++) {

				let d = data[i];

				if (d.source && d.target) {
					let sourceVar = d.source[variable];
					let targetVar = d.target[variable];

					if (result[sourceVar]) {
						result[sourceVar].push(targetVar);
						result[sourceVar]["_$id$"].push(i);
					} else {
						result[sourceVar] = [targetVar];
						result[sourceVar]["_$id$"] = [i];
					}

					if (result[targetVar]) {
						result[targetVar].push(sourceVar);
						result[targetVar]["_$id$"].push(i);
					} else {
						result[targetVar] = [sourceVar];
						result[targetVar]["_$id$"] = [i];
					}
				}
			}

			return result

		}

		function searchNodeLink(data, seq) {

			let linksPerNode;

			if (type === "directed") {
				linksPerNode = _getLinksDirected(data);
			} else if (type === "undirected") {
				linksPerNode = _getLinksUndirected(data);
			}

			let allIndices = [];
			
			for (let i=0; i<seq.length - 1; i++) {

				let currentItem = seq[i];
				let nextItem = seq[i+1];

				let inLinks = linksPerNode[currentItem].indexOf(nextItem);

				if (inLinks >= 0) {
					allIndices.push(linksPerNode[currentItem]["_$id$"][inLinks]);
					continue;
				} else {
					return false;
				}

			}

			return new Set(allIndices);

		}

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

					if (type === "directed" || type === "undirected") {
						let search = searchNodeLink(data, seq);

						if (!search) {
							// If this nodelink sequence does not exist
							continue;
						}
						else {
							// If this nodelink sequence does exist
							result = result.union(search);
							
							for (let i=0; i<data.length; i++) {

								if (seq.indexOf(data[i][variable]) >= 0) {
									result.add(i);
								}

							}
						}

					} else {
						result = result.union(searchSequence(data, seq, variableSerialized, variableSerializedKeys));
					}

				}

				return result

			} else {

				if (type === "directed" || type === "undirected") {
					let search = searchNodeLink(data, sequence);

					if (!search) {
						// If this nodelink sequence does not exist
						return new Set();
					}
					else {
						// If this nodelink sequence does exist
						
						for (let i=0; i<data.length; i++) {

							if (sequence.indexOf(data[i][variable]) >= 0) {
								search.add(i);
							}

						}
					}

					return search
				} else {
					return searchSequence(data, sequence, variableSerialized, variableSerializedKeys)
				}
				
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
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 1, this._aggregator(this._variable, this._sequence, this._type));

		let strokeAug = new Aug(`${this._id}_stroke`, "sequence_stroke", "encoding", undefined,
								   this._generator(this._variable, this._sequence),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 2, this._aggregator(this._variable, this._sequence, this._type));

		let fillAug = new Aug(`${this._id}_fill`, "sequence_fill", "encoding", undefined,
								  this._generator(this._variable, this._sequence),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 3, this._aggregator(this._variable, this._sequence, this._type));

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