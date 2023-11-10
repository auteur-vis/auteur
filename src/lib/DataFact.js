import { v4 as uuidv4 } from 'uuid';

import Aug from "./Aug.js";

export default class DataFact {

	constructor() {
		this._id = `df${uuidv4()}`;
		this._name = "DFBase";
		this._selection;
	}

	selection(selection) {
		this._selection = selection;
		return this
	}

	// {"type": ["encoding", "mark", ...], "rank": 1, 2, 3..., "name": ["line", "color", "opacity", ...]}
	include(inclusions) {

		this._include = inclusions;

		return this;

	}

	// exclusions take priority
	// {"type": [encoding", "mark", ...], "rank": 1, 2, 3..., "name": ["line", "color", "opacity", ...]}
	exclude(exclusions) {

		this._exclude = exclusions;

		return this;

	}

	mergeStyles(customs, defaults) {

		if (customs && !defaults) {
			return customs
		} else if (!customs && defaults) {
			return defaults
		} else if (customs && defaults) {
			let result = {};
			let allKeys = Array.from(new Set(Object.keys(defaults).concat(Object.keys(customs))));

			for (let k of allKeys) {

				result[k] = customs[k] ? customs[k] : defaults[k];

			}

			return result
		} else {
			return {}
		}

	}

	_updateStyles(oldStyles, newStyles) {

		if (!newStyles) {return {};}

		let resultStyles = JSON.parse(JSON.stringify(oldStyles));

		for (let s of Object.keys(newStyles)) {
			resultStyles[s] = newStyles[s];
		}

		return resultStyles;

	}

	_sort(a, b) {
		return a.rank - b.rank;
	}

	_filter(augs) {

		let filteredAugs = augs;

		// first filter by rank
		// rank filtering is exactly the same for both include and exclude
		// exclude takes precedence
		if (this._exclude) {
			if (this._exclude["rank"]) {
				filteredAugs = filteredAugs.filter(d => d.rank <= this._exclude["rank"]);
			}
			
			if (this._exclude["type"]) {
				filteredAugs = filteredAugs.filter(d => this._exclude["type"].indexOf(d.type) < 0);
			}

			if (this._exclude["name"]) {
				filteredAugs = filteredAugs.filter(d => this._exclude["name"].indexOf(d.name.split("_")[1]) < 0);
			}

		} else if (this._include && this._include["name"]) {
			if (this._include["rank"]) {
				filteredAugs = filteredAugs.filter(d => d.rank <= this._include["rank"]);
			}

			if (this._exclude["type"]) {
				filteredAugs = filteredAugs.filter(d => this._exclude["type"].indexOf(d.type) >= 0);
			}

			if (this._exclude["name"]) {
				filteredAugs = filteredAugs.filter(d => this._exclude["name"].indexOf(d.name.split("_")[1]) >= 0);
			}
		}

		// console.log(filteredAugs)

		return filteredAugs;

	}

	// Merge augmentations between multiple data facts
	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	_mergeAugs(augs1, augs2, intersect_id, merge_by="intersect") {

		let merged = [];

		while (augs1.length > 0) {

			let last = augs1.pop();

			// mark type augmentations are not merged
			if (last.type === "mark") {

				merged.push(last);

			} else {

				let foundIndex = augs2.findIndex(ag => ag.name === last.name && ag.type === "encoding");

				// if no augmentation of the same name is found, add to list without merging
				if (foundIndex < 0) {

					merged.push(last);

				} else {

					let matched_aug = augs2.splice(foundIndex, 1)[0];

					// new id is combination of aug ids
					let split_id = last.id.split('_');
					split_id[0] = intersect_id;
					let new_id = split_id.join('_');

					// combine generators
					function generator(datum, xVar, yVar, xScale, yScale) {

						if (merge_by === "intersect" && (last.generator(datum, xVar, yVar, xScale, yScale) && matched_aug.generator(datum, xVar, yVar, xScale, yScale))) {
							return true;
						} else if (merge_by === "union" && (last.generator(datum, xVar, yVar, xScale, yScale) || matched_aug.generator(datum, xVar, yVar, xScale, yScale))) {
							return true;
						} else if (merge_by === "difference" && (last.generator(datum, xVar, yVar, xScale, yScale) && !matched_aug.generator(datum, xVar, yVar, xScale, yScale))) {
							return true;
						} else if (merge_by === "xor" && ((last.generator(datum, xVar, yVar, xScale, yScale) || matched_aug.generator(datum, xVar, yVar, xScale, yScale)) && !(last.generator(datum, xVar, yVar, xScale, yScale) && matched_aug.generator(datum, xVar, yVar, xScale, yScale)))) {
							return true;
						}

						return false;

					}

					let new_aug = new Aug(new_id, last.name, last.type, last.encoding, generator, last.styles, last.selection, last.rank);
					merged.push(new_aug.getSpec());

				}

			}

		}

		return merged.concat(augs2).sort(this._sort)

	}

}