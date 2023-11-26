import * as d3 from "d3";

import Aug from "./Aug.js";
import DataFact from "./DataFact.js";

import markStyles from "./styles/markStyles.js";
import encodingStyles from "./styles/encodingStyles.js";

export default class Threshold extends DataFact {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(variable, val, type="eq", styles={}) {

		super();
		
		this._name = "Threshold";

		this._variable = variable;
		this._val = val;

		this._type = type;

		this._customStyles = styles;

	}

	// general generator, usually for encoding type augmentations
	_generator(variable, val, type) {

		let parseVal = this._parseVal;

		return function(datum, xVar, yVar, xScale, yScale, stats) {

			let parsed = parseVal(variable, val, xVar, yVar, stats);
			
			if (Array.isArray(datum)) {
				if (type === "eq") {
					return datum.reduce((acc, current) => acc && current[variable] == parsed, true);
				} else if (type === "le") {
					return datum.reduce((acc, current) => acc && current[variable] < parsed, true);
				} else if (type === "leq") {
					return datum.reduce((acc, current) => acc && current[variable] <= parsed, true);
				} else if (type === "ge") {
					return datum.reduce((acc, current) => acc && current[variable] > parsed, true);
				} else if (type === "geq") {
					return datum.reduce((acc, current) => acc && current[variable] >= parsed, true);
				}

			} else {
				if (type === "eq" && datum[variable] == parsed) {
					return true;
				} else if (type === "le" && datum[variable] < parsed) {
					return true;
				} else if (type === "leq" && datum[variable] <= parsed) {
					return true;
				} else if (type === "ge" && datum[variable] > parsed) {
					return true;
				} else if (type === "geq" && datum[variable] >= parsed) {
					return true;
				}
			}

			return false;
		}

	}

	// generator for line augmentation
	generateLine(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsed = parseVal(variable, val, xVar, yVar, stats);

			if (xVar == variable) {
				return [{"x1": xScale(parsed), "x2": xScale(parsed), "y1":yScale.range()[0], "y2":yScale.range()[1]}];
			} else if (yVar == variable) {
				return [{"x1": xScale.range()[0], "x2": xScale.range()[1], "y1": yScale(parsed), "y2": yScale(parsed)}];
			}
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression(variable, val, type) {

		let regression = this._findLineByLeastSquares;
		let regressionFilter = this._generator(variable, val, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {
			
			let filtered = data.filter(d => regressionFilter(d, xVar, yVar, xScale, yScale, stats));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for text augmentation
	generateText(variable, val, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsed = parseVal(variable, val, xVar, yVar, stats);

			if (type === "le" || type === "leq") {
				if (xVar == variable) {
					return [{"x": xScale(parsed) + 10, "y": yScale.range()[1], "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${parsed}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) + 10, "text": `${variable} ${"le" == type ? "less than" : "less than or equal to"} ${parsed}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"x": xScale(parsed) + 10, "y": yScale.range()[1], "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${parsed}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) + 10, "text": `${variable} ${"ge" == type ? "greater than" : "greater than or equal to"} ${parsed}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"x": xScale(parsed) + 10, "y": yScale.range()[1], "text": `${variable} ${"equal to"} ${parsed}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) - 10, "text": `${variable} ${"equal to"} ${parsed}`}];
				}
			}

			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let lineAug = new Aug(`${this._id}_line`, "threshold_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 1);

		let opacityAug = new Aug(`${this._id}_opacity`, "threshold_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let strokeAug = new Aug(`${this._id}_stroke`, "threshold_stroke", "encoding", undefined,
								   this._generator(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "threshold_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 5);

		let regressionAug = new Aug(`${this._id}_regression`, "threshold_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._val, this._type);

		return this._filter([lineAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), regressionAugs]).sort(this._sort)
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

	// If merging mutliple thresholds, use custom merge function
	// Creates only a single regression line
	// Merge by options: intersect, union, difference (in aug1 not in aug2), xor (in aug1 or aug2, not both)
	_mergeThresholds(augs1, augs2, intersect_id, merge_by="intersect") {

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

	// returns a list of [Aug Class]
	// criteria can be a single augmentation or a list of augmentations [aug, aug, ...]
	intersect(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeThresholds(all_merged, new_augs, merged_id);
			} else if (d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id);
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	union(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeThresholds(all_merged, new_augs, merged_id, "union");
			} else if (d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW

	// returns a list of [Aug Class]
	// difference(criteria) {

	// 	if (criteria._name.startsWith("Threshold")) {

	// 		let intersect_id = `${this._id}-${criteria._id}`;

	// 		let my_augs = this.getAugs();
	// 		let criteria_augs = criteria.getAugs();
	// 		let merged_augs = this._mergeAugs(my_augs, criteria_augs, intersect_id, "difference");

	// 		return merged_augs
	// 	}
	// }

	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW
	// EXCLUDED FOR NOW

	// returns a list of [Aug Class]
	xor(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeThresholds(all_merged, new_augs, merged_id, "xor");
			} else if (d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "xor");
			}
		}

		return all_merged
	}
}