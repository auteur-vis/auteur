import { v4 as uuidv4 } from 'uuid';
import * as d3 from "d3";

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

	select(selector) {
		this._selection = d3.selectAll(selector);
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
		return b.rank - a.rank;
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

			if (this._include["type"]) {
				filteredAugs = filteredAugs.filter(d => this._include["type"].indexOf(d.type) >= 0);
			}

			if (this._include["name"]) {
				filteredAugs = filteredAugs.filter(d => this._include["name"].indexOf(d.name.split("_")[1]) >= 0);
			}
		}

		// console.log(filteredAugs)

		return filteredAugs;

	}

	_parseVal(variable, val, xVar, yVar, stats) {

		let values = stats[variable];

		// If statistics could not be calculated e.g. for categorical variables
		if (!values) {
			return val
		}

		// If val is a summary statistic e.g. "mean"
		if (values[val]) {
			return values[val]
		} else {
			return val
		}

	}

	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	_mergeAugs(augs1, augs2, intersect_id, merge_by="intersect") {

		let merged = [];

		while (augs1.length > 0) {

			let last = augs1.pop();

			// mark type augmentations are not merged
			if (last.type === "mark") {

				if (last.name.endsWith("regression")) {

					let foundIndex = augs2.findIndex(ag => {
						let split_name = last.name.split('_');
						let split_ag = ag.name.split('_');

						return split_name[1] === split_ag[1] && ag.type === "mark"
					});

					// if no augmentation of the same name is found, add to list without merging
					if (foundIndex < 0) {

						merged.push(last);

					}

					let matched_aug = augs2.splice(foundIndex, 1)[0];

					// new id is combination of aug ids
					let split_id = last.id.split('_');
					split_id[0] = intersect_id;
					let new_id = split_id.join('_');

					// new name is combination of aug names
					let split_name = last.name.split('_');
					split_name[0] = "merged";
					let new_name = split_name.join('_');

					let regression = this._findLineByLeastSquares;

					// combine filter
					function combinedFilter(datum, xVar, yVar, xScale, yScale, stats) {

						if (merge_by === "intersect" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) && matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "union" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) || matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "difference" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) && !matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "xor"
									&& ((last._filter(datum, xVar, yVar, xScale, yScale, stats) || matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))
									&& !(last._filter(datum, xVar, yVar, xScale, yScale, stats) && matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats)))) {
							return true;
						}

						return false;

					}

					// combine regression generators
					function regressionGenerator(data, xVar, yVar, xScale, yScale, stats) {

						let filtered =  data.filter(d => combinedFilter(d, xVar, yVar, xScale, yScale, stats));

						let xValues = filtered.map(d => xScale(d[xVar]));
						let yValues = filtered.map(d => yScale(d[yVar]));

						let coords = regression(xValues, yValues);

						return coords

					}

					let new_aug = new Aug(new_id, new_name, last.type, last.encoding, regressionGenerator, last.styles, last.selection, last.rank);
					let new_augs = new_aug.getSpec();
					new_augs._filter = combinedFilter;
					merged.push(new_augs);

				} else {
					merged.push(last);
				}

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

					// new name is combination of aug names
					let split_name = last.name.split('_');
					split_name[0] = "merged";
					let new_name = split_name.join('_');

					// combine generators
					function generator(datum, xVar, yVar, xScale, yScale, stats) {

						if (merge_by === "intersect" && (last.generator(datum, xVar, yVar, xScale, yScale, stats) && matched_aug.generator(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "union" && (last.generator(datum, xVar, yVar, xScale, yScale, stats) || matched_aug.generator(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "difference" && (last.generator(datum, xVar, yVar, xScale, yScale, stats) && !matched_aug.generator(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "xor"
									&& ((last.generator(datum, xVar, yVar, xScale, yScale, stats) || matched_aug.generator(datum, xVar, yVar, xScale, yScale, stats))
									&& !(last.generator(datum, xVar, yVar, xScale, yScale, stats) && matched_aug.generator(datum, xVar, yVar, xScale, yScale, stats)))) {
							return true;
						}

						return false;

					}

					let new_aug = new Aug(new_id, new_name, last.type, last.encoding, generator, last.styles, last.selection, last.rank);
					merged.push(new_aug.getSpec());

				}

			}

		}

		return merged.concat(augs2).sort(this._sort)

	}

	// Following function from https://dracoblue.net/dev/linear-least-squares-in-javascript/
	_findLineByLeastSquares(values_x, values_y) {
	    var sum_x = 0;
	    var sum_y = 0;
	    var sum_xy = 0;
	    var sum_xx = 0;
	    var count = 0;

	    /*
	     * We'll use those variables for faster read/write access.
	     */
	    var x = 0;
	    var y = 0;
	    var values_length = values_x.length;

	    if (values_length != values_y.length) {
	        throw new Error('The parameters values_x and values_y need to have same size!');
	    }

	    /*
	     * Nothing to do.
	     */
	    if (values_length === 0) {
	        return [ [], [] ];
	    }

	    /*
	     * Calculate the sum for each of the parts necessary.
	     */
	    for (var v = 0; v < values_length; v++) {
	        x = values_x[v];
	        y = values_y[v];
	        sum_x += x;
	        sum_y += y;
	        sum_xx += x*x;
	        sum_xy += x*y;
	        count++;
	    }

	    /*
	     * Calculate m and b for the formula:
	     * y = x * m + b
	     */
	    var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
	    var b = (sum_y/count) - (m*sum_x)/count;
    
	    let [x1, x2] = d3.extent(values_x);
	    let [y1, y2] = [x1 * m + b, x2 * m + b];

	    return [{"x1":x1, "y1":y1, "x2":x2, "y2":y2}]
	}

}