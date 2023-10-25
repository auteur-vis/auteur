import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

// Just add data
export default class LocalData extends DataFact {

	constructor(val, styles={}) {

		super();

		this._name = "LocalData";

		this._local = val;

		this._customStyles = styles;

	}

	// generator for mark augmentation
	generateMark(local=[]) {
		
		return function(data, xVar, yVar, xScale, yScale) {
			
			return(local.map(ld => {
				ld.x = xScale(ld[xVar]);
				ld.y = yScale(ld[yVar]);
				return ld
			}))

		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let markAug = new Aug(`${this._id}_mark`, "derived_mark", "mark", {"mark":undefined},
										 this.generateMark(this._local), 
										 this.mergeStyles(this._customStyles.mark, undefined), 1);

		return [markAug.getSpec()].sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	updateFunction(fn) {
		this._fn = fn;
	}

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
	}

	// // Merge augmentations between multiple data facts
	// // Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
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

	// 				let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.rank);
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