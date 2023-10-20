import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Emphasis extends DataFact {

	// val can either be a single value or list of values
	constructor(variable, val, styles={}) {

		super();
		
		this._name = "Emphasis";

		this._variable = variable;
		this._val = val;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	generateEncoding(variable, val, type) {

		return function(datum, xVar, yVar, xScale, yScale) {

			if (Array.isArray(val)) {
				if (val.indexOf(datum[variable]) >= 0) {
					return true;
				} else {
					return false;
				}
			} else {
				if (datum[variable] == val) {
					return true;
				}
			}

			return false;
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {

		return function(data, xVar, yVar, xScale, yScale) {

			let result;

			if (Array.isArray(val)) {

				result = data.filter(d => val.indexOf(d.variable) >= 0).map(d => {return {"x": xScale(d.xVar), "y": yScale(d.yVar) - 10, "text": `${variable} = ${d.variable}`}});

			} else {

				result = data.filter(d => val == d.variable).map(d => {return {"x": xScale(d.xVar), "y": yScale(d.yVar) - 10, "text": `${variable} = ${d.variable}`}});
			}

			return result;
			
		}
 
	}

	_sort(a, b) {
		return a.rank - b.rank;
	}

	// returns a list of [Aug Class]
	getAugs() {

		let strokeAug = new Aug(`${this._id}_stroke`, "emphasis_stroke", "encoding", undefined,
								   this.generateEncoding(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), 1);

		let textAug = new Aug(`${this._id}_text`, "emphasis_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), 2);

		let fillAug = new Aug(`${this._id}_fill`, "emphasis_fill", "encoding", undefined,
								  this.generateEncoding(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), 3);

		let opacityAug = new Aug(`${this._id}_opacity`, "emphasis_opacity", "encoding", undefined,
									this.generateEncoding(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), 4);

		return [strokeAug.getSpec(), textAug.getSpec(), fillAug.getSpec(), opacityAug.getSpec()].sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	updateStyles(styles) {
		this._customStyles = this._updateStyles(this._customStyles, styles);
	}

	// Merge augmentations between multiple data facts
	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	// _mergeAugs(augs1, augs2, intersect_id, merge_by="intersect") {

	// 	let merged = [];

	// 	while (augs1.length > 0) {

	// 		let last = augs1.pop();

	// 		// mark type augmentations are not merged
	// 		if (last.type === "mark") {

	// 			merged.push(last);

	// 		} else {

	// 			let foundIndex = augs2.findIndex(ag => ag.name === last.name && ag.type === "encoding");

	// 			// if no augmentation of the same name is found, add to list without merging
	// 			if (foundIndex < 0) {

	// 				merged.push(last);

	// 			} else {

	// 				let matched_aug = augs2.splice(foundIndex, 1)[0];

	// 				// new id is combination of aug ids
	// 				let split_id = last.id.split('_');
	// 				split_id[0] = intersect_id;
	// 				let new_id = split_id.join('_');

	// 				// combine generators
	// 				function generator(datum) {

	// 					if (merge_by === "intersect" && (last.generator(datum) && matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "union" && (last.generator(datum) || matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "difference" && (last.generator(datum) && !matched_aug.generator(datum))) {
	// 						return true;
	// 					} else if (merge_by === "xor" && ((last.generator(datum) || matched_aug.generator(datum)) && !(last.generator(datum) && matched_aug.generator(datum)))) {
	// 						return true;
	// 					}

	// 					return false;

	// 				}

	// 				let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.styles, last.rank);
	// 				merged.push(new_aug.getSpec());

	// 			}

	// 		}

	// 	}

	// 	return merged.concat(augs2).sort(this._sort)

	// }

	// // returns a list of [Aug Class]
	// intersect(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id);

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// union(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "union");

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// difference(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "difference");

	// 		return merged_augs
	// 	}
	// }

	// // returns a list of [Aug Class]
	// xor(drft) {

	// 	if (drft._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${drft._id}`;

	// 		let my_augs = this.getAugs();
	// 		let drft_augs = drft.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, drft_augs, intersect_id, "xor");

	// 		return merged_augs
	// 	}
	// }
}