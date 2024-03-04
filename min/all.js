import { mean, ascending, quantileSorted, extent, min } from 'd3-array';
import { select, selectAll } from 'd3-selection';
import { line } from 'd3-shape';
import { v4 } from 'uuid';

// import React, {useRef, useState, useEffect} from "react";
// import * as d3 from "d3";


class Draft {

	constructor() {

		this._id = `chart${v4()}`;

		this._include = null;
		this._exclude = null;

		this._layer;

	}

	chart(el) {

		this._chart = select(el);
		this._chart.append("g").attr("id", "draughty");

		return this;

	}

	layer(selector) {
		this._layer = selector;

		return this;
	}

	// Select elements by selector (e.g. class)
	// Use either this or selection()
	select(selector) {

		this._selector = selector;
		this._selection = this._chart.selectAll(selector);
		this._data = this._selection.data();
		this._stats = this._getStats(this._data);

		return this;

	}

	// Elements already selected
	// Use either this or select()
	selection(selected) {

		this._selection = selected;
		this._data = selected.data();
		this._stats = this._getStats(this._data);

		return this;

	}

	// Optional, overrides selection data with local data
	data(data) {

		this._data = data;

		return this;

	}

	x(variable, scaleX) {

		this._xVar = variable;
		this._xScale = scaleX;

		return this;

	}

	y(variable, scaleY) {

		this._yVar = variable;
		this._yScale = scaleY;

		return this;

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

	_handleLine(aug, data, draughtLayer) {

		// let draughtLayer = this._chart.select("#draughty");

		if (data.length >= 1) {
			// let orient = data[0]["x1"] ? "x" : "y";

			let newLines = draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("line")
							.attr("id", aug.id)
							.attr("x1", d => d["x1"])
							.attr("y1", d => d["y1"])
							.attr("x2", d => d["x2"])
							.attr("y2", d => d["y2"]);

			for (let s of Object.keys(aug.styles)) {
				newLines.attr(s, (d, i) => {
					let customStyle = aug.styles[s];
					if (typeof customStyle === "function") {
						return customStyle(d, i)
					} else {
						return customStyle
					}
				});
			}

		} else {
			draughtLayer.selectAll(`#${aug.id}`)
						.data(data)
						.join("line")
						.attr("id", aug.id);
		}

	}

	_handleRect(aug, data, draughtLayer) {

		// let draughtLayer = this._chart.select("#draughty");

		if (data.length >= 1) {
			let newRects = draughtLayer.selectAll(`#${aug.id}`)
											.data(data)
											.join("rect")
											.attr("id", aug.id)
											.attr("x", d => d["x"])
											.attr("width", d => d["width"])
											.attr("y", d => d["y"])
											.attr("height", d => d["height"]);

			for (let s of Object.keys(aug.styles)) {
				newRects.attr(s, (d, i) => {
					let customStyle = aug.styles[s];
					if (typeof customStyle === "function") {
						return customStyle(d, i)
					} else {
						return customStyle
					}
				});
			}

		} else {
			draughtLayer.selectAll(`#${aug.id}`)
						.data(data)
						.join("line")
						.attr("id", aug.id);
		}

	}

	_handleText(aug, data, draughtLayer) {

		// let draughtLayer = this._chart.select(this._layer ? this._layer : "#draughty");

		let newText;

		if (data.length > 0) {

			newText = draughtLayer.selectAll(`#${aug.id}`)
						.data(data)
						.join("text")
						.attr("id", aug.id)
						.attr("x", d => d.x)
						.attr("y", d => d.y)
						.attr("font-family", "sans-serif")
						.attr("font-size", 11)
						.attr("alignment-baseline", d => d.baseline ? d.baseline : "middle")
						.attr("text-anchor", d => d.anchor ? d.anchor : "start")
						.attr("xml:space", "preserve")
						.text(d => d["text"]);

			for (let s of Object.keys(aug.styles)) {
				// Text customization is handled differently due to innerHTML
				if (s === "text") {
					newText.text((d, i) => {
						let customStyle = aug.styles[s];
						if (typeof customStyle === "function") {
							return customStyle(d, i)
						} else {
							return customStyle
						}
					}
				);} else {
					newText.attr(s, (d, i) => {
						let customStyle = aug.styles[s];
						if (typeof customStyle === "function") {
							return customStyle(d, i)
						} else {
							return customStyle
						}
					});	
				}
			}
		} else {
			// Remove existing text
			draughtLayer.selectAll(`#${aug.id}`)
						.data(data)
						.join("text")
						.attr("id", aug.id);
		}

	}

	_handleMarkMultiple(aug, data, draughtLayer, clone=true) {

		// let draughtLayer = this._chart.select("#draughty");
		let elements = this._selection.nodes();

		let newMultiples;

		// handle paths
		if (Array.isArray(data[0]) && elements[0].nodeName.startsWith("path")) {

			if (data[0][0]["x"] && !data[0][0]["y"]) {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("class", `${aug.id}_multiple`)
											.attr("d", (d, i) => {
												return line()
													.x(d => d.x)
													.y(d => this._yScale(d[this._yVar]))(d);
											});

			} else if (data[0][0]["y"] && !data[0][0]["x"]) {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("class", `${aug.id}_multiple`)
											.attr("d", (d, i) => {
												return line()
													.x(di => this._xScale(di[this._xVar]))
													.y(di => di.y)(d);
											});

			} else {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("d", (d, i) => {
												return line()
													.x(d => d.x)
													.y(d => d.y);
											});

			}

		} else {

			if (data[0]["x"] && !data[0]["y"]) {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("class", `${aug.id}_multiple`)
											.attr("cx", (d, i) => {
												if (!elements[i].cx) {return}
												return d.deltx != null ? elements[i].cx.baseVal.value + d.deltx : d.x
											})
											.attr("x", (d, i) => {
												if (!elements[i].x) {return} 
												return d.deltx != null ? elements[i].x.baseVal.value + d.deltx : d.x
											})
											.attr("width", (d, i) => {
												if (!elements[i].width) {return}
												return d.deltx != null ? elements[i].width.baseVal.value + d.deltx : d.x
											});

			} else if (data[0]["y"] && !data[0]["x"]) {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("class", `${aug.id}_multiple`)
											.attr("cy", (d, i) => {
												if (!elements[i].cy) {return}
												return d.delty != null ? elements[i].cy.baseVal.value + d.delty : d.y
											})
											.attr("y", (d, i) => {
												if (!elements[i].y) {return}
												return d.delty != null ? elements[i].y.baseVal.value + d.delty : d.y
											})
											.attr("height", (d, i) => {
												if (!elements[i].height) {return}
												return d.delty != null ? elements[i].height.baseVal.value - d.delty : d.y
											});

			} else {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("cx", (d, i) => {
												if (!elements[i].cx) {return}
												return d.deltx != null ? elements[i].cx.baseVal.value + d.deltx : d.x
											})
											.attr("x", (d, i) => {
												if (!elements[i].x) {return} 
												return d.deltx != null ? elements[i].x.baseVal.value + d.deltx : d.x
											})
											.attr("width", (d, i) => {
												if (!elements[i].width) {return}
												return d.deltx != null ? elements[i].width.baseVal.value + d.deltx : d.x
											})
											.attr("cy", (d, i) => {
												if (!elements[i].cy) {return}
												return d.delty != null ? elements[i].cy.baseVal.value + d.delty : d.y
											})
											.attr("y", (d, i) => {
												if (!elements[i].y) {return}
												return d.delty != null ? elements[i].y.baseVal.value + d.delty : d.y
											})
											.attr("height", (d, i) => {
												if (!elements[i].height) {return}
												return d.delty != null ? elements[i].height.baseVal.value - d.delty : d.y
											});

			}

		}

		for (let s of Object.keys(aug.styles)) {
			newMultiples.attr(s, (d, i) => {
				let customStyle = aug.styles[s];
				if (typeof customStyle === "function") {
					return customStyle(d, i)
				} else {
					return customStyle
				}
			});
		}

	}

	_round(val) {
		return Math.round(val * 100) / 100;
	}

	_getStats(data) {

		if (data.length === 0) {
			return {};
		}

		let variables = Object.keys(data[0]);

		let variableStats = {};

		for (let v of variables) {

			let mean$1 = this._round(mean(data, d => d[v]));

			// If median cannot be calculated, assume categorical variable
			if (!mean$1) {
				continue
			} else {
				
				let sorted = data.map(d => d[v]).sort(ascending);

				let median = this._round(quantileSorted(sorted, 0.5));

				let Q3 = this._round(quantileSorted(sorted, 0.75));
				let Q1 = this._round(quantileSorted(sorted, 0.25));

				let min = sorted[0];
				let max = sorted[sorted.length - 1];

				// Outlier lower and upper bounds
				let lowerBound = this._round(Q1 - 1.5 * (Q3 - Q1));
				let upperBound = this._round(Q3 + 1.5 * (Q3 - Q1));

				variableStats[v] = {"min": min,
									"Q1": Q1,
									"mean": mean$1,
									"median": median,
									"Q3": Q3,
									"max": max,
									"lowerBound": lowerBound,
									"upperBound": upperBound};
			}

		}

		return variableStats

	}

	augment(augmentations) {

		let filteredAugs = augmentations;
		let draughtLayer = this._chart.select(this._layer ? this._layer : "#draughty");

		if (augmentations.length === 0) {

			selectAll(`${this._layer ? this._layer : "#draughty"} > *`).remove();

		}

		// first filter by rank
		// rank filtering is exactly the same for both include and exclude
		if (this._exclude && this._exclude["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._exclude["rank"]);
		} else if (this._include && this._include["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._include["rank"]);
		}

		for (let a of filteredAugs) {

			let select = (a.selection && a.selection.size() > 0) ? a.selection : this._selection;
			let selectData = (a.selection && a.selection.size() > 0) ? a.selection.data() : this._data;
			let stats = (a.selection && a.selection.size() > 0) ? this._getStats(selectData) : this._stats;

			// filter by type: encoding/mark/axis/etc...
			if (this._exclude && this._exclude["type"]) {
				if (this._exclude["type"].indexOf(a.type) >= 0) {
					continue
				}
			} else if (this._include && this._include["type"]) {
				if (this._include["type"].indexOf(a.type) === -1) {
					continue
				}
			}

			// filter by name: line/opacity/text/etc...
			if (this._exclude && this._exclude["name"]) {
				if (this._exclude["name"].indexOf(a.name.split("_")[1]) >= 0) {
					continue
				}
			} else if (this._include && this._include["name"]) {
				if (this._include["name"].indexOf(a.name.split("_")[1]) === -1) {
					continue
				}
			}

			// Handle augmentations that change encoding(s)
			if (a.type === "encoding") {
				
				let encoding = a.name.split("_")[1];
				let styles = a.styles;

				for (let s of Object.keys(styles)) {

					// Local selections override global selections
					if (this._selection) {this._selection.style(s, undefined);}
					if (!s.startsWith(encoding)) {continue;}

					if (s === "opacity") {

						select.style(s, (d, i, n) => {

							if (a.generator(d, this._xVar, this._yVar, this._xScale, this._yScale, stats)) {
								let customStyle = styles[s];

								if (typeof customStyle === "function") {
									return customStyle(d, i)
								} else {
									return customStyle
								}
							} else {
								return 0.25;
							}
							
						});

					} else {

						select.style(s, (d, i) => {

							if (a.generator(d, this._xVar, this._yVar, this._xScale, this._yScale, stats)) {
								let customStyle = styles[s];

								if (typeof customStyle === "function") {
									return customStyle(d, i)
								} else {
									return customStyle
								}
							}
							
						});

					}
					
				}

			} else if (a.type === "mark") {
				// Handle augmentations that add marks

				// Check that the right x and y variables are used in chart
				let draughtData = a.generator(selectData, this._xVar, this._yVar, this._xScale, this._yScale, stats);

				if (draughtData && a.encoding.mark === "line") {
					// Add a line mark (single straight line)
					this._handleLine(a, draughtData, draughtLayer);
				} else if (draughtData && a.encoding.mark === "text") {
					// Add a text mark
					this._handleText(a, draughtData, draughtLayer);
				} else if (draughtData && a.encoding.mark === "rect") {
					// Add a text mark
					this._handleRect(a, draughtData, draughtLayer);
				} else if (draughtData && !a.encoding.mark) {
					// If no mark specified, duplicate existing mark(s)
					if (a.name.endsWith("multiple")) {
						this._handleMarkMultiple(a, draughtData, draughtLayer);
					} else {
						this._handleMarkMultiple(a, draughtData, draughtLayer, false);
					}
					
				}

			}

		}

		return this;

	}

}

class Aug {

	constructor(id, name="", type="", encoding={}, generator, styles, selection, rank) {

		this._id = id;
		this._name = name;
		this._type = type;
		this._encoding = encoding;
		this._generator = generator;
		this._styles = styles;
		this._rank = rank;
		this._selection = selection;
	}

	getSpec() {

		return {"id": this._id,
				"name": this._name,
				"type": this._type,
				"encoding": this._encoding,
				"generator": this._generator,
				"styles": this._styles,
				"rank": this._rank,
				"selection": this._selection
			}
	}

}

class GenerationCriteriaBase {

	constructor() {
		this._id = `df${v4()}`;
		this._name = "DFBase";
		this._selection;
	}

	selection(selection) {
		this._selection = selection;
		return this
	}

	select(selector) {
		this._selection = selectAll(selector);
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

	updateStyles(styles, override = false) {
		if (override) {
			this._customStyles = styles;
		} else {
			this._customStyles = this._updateStyles(this._customStyles, styles);
		}
		return this;
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

	// Merge by options: intersect, union, diff (in aug1 not in aug2), symmdiff (symmetric difference in aug1 or aug2, not both)
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
						} else if (merge_by === "symmdiff"
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

				} else if (last.name.endsWith("label")) {

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

					this._findLineByLeastSquares;

					// combine filter
					function combinedFilter(datum, xVar, yVar, xScale, yScale, stats) {

						if (merge_by === "intersect" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) && matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "union" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) || matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "difference" && (last._filter(datum, xVar, yVar, xScale, yScale, stats) && !matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))) {
							return true;
						} else if (merge_by === "symmdiff"
									&& ((last._filter(datum, xVar, yVar, xScale, yScale, stats) || matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats))
									&& !(last._filter(datum, xVar, yVar, xScale, yScale, stats) && matched_aug._filter(datum, xVar, yVar, xScale, yScale, stats)))) {
							return true;
						}

						return false;

					}

					let variable = this._variable;

					function labelGenerator(data, xVar, yVar, xScale, yScale, stats) {

						let result;

						result = data.filter(d => combinedFilter(d, xVar, yVar, xScale, yScale, stats)).map(d => {
							d.x = xScale(d[xVar]);
							d.y = yScale(d[yVar]) - 15;
							// d.text = `${variable} = ${d[variable]}`;
							d.text = `${variable ? d[variable] : ""}`;

							return d
						});

						return result;

					}

					let new_aug = new Aug(new_id, new_name, last.type, last.encoding, labelGenerator, last.styles, last.selection, last.rank);
					let new_augs = new_aug.getSpec();
					new_augs._filter = combinedFilter;
					merged.push(new_augs);

				} else {
					merged.push(last);
				}

			} else {

				let foundIndex = augs2.findIndex(ag => {
					let split_name = last.name.split('_');
					let split_ag = ag.name.split('_');

					return split_name[1] === split_ag[1] && ag.type === "encoding"
				});

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
						} else if (merge_by === "symmdiff"
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
    
	    let [x1, x2] = extent(values_x);
	    let [y1, y2] = [x1 * m + b, x2 * m + b];

	    return [{"x1":x1, "y1":y1, "x2":x2, "y2":y2}]
	}

}

var markStyles = {
	"line": {
		"stroke": "black",
		"stroke-opacity": 1,
		"stroke-width": "1px"
	},
	"regression": {
		"stroke": "black",
		"stroke-opacity": 1,
		"stroke-width": "1px"
	},
	"text": {
		"font-family":"sans-serif",
		"font-size":11
	},
	"label": {
		"font-family":"sans-serif",
		"font-size":11,
		"text-anchor": "middle",
	},
	"rect": {
		"opacity": 0.1,
		"fill": "black"
	},
	"multiple": {
		"stroke-opacity": 0.25,
	}
};

var encodingStyles = {
	"opacity": {
		"opacity": 1
	},
	"stroke": {
		"stroke": "black",
		"stroke-opacity": 1,
		"stroke-width": "1px"
	},
	"fill": {
		"fill": "#eb4034"
	}
};

class DerivedValues extends GenerationCriteriaBase {

	// variable: original variable
	// calc: "add", "sub", "mult", "div"
	// val: either a constant or variable name
	// fn: custom function, returns Number
	constructor(variable, val=0, calc="add", fn, styles={}) {

		super();

		this._name = "DerivedData";

		this._variable = variable;

		// keeps track of the type of derived value
		// determines the augmentations later
		this._type;

		if (fn) {
			this._fn = fn;
			this._type = "custom";
		} else {
			this._val = val;
			this._calc = calc;
			this._type = typeof(val) === "number" ? "constant" : "variable";
		}

		this._customStyles = styles;

	}

	// generator for mark augmentation
	generateMark(variable, val, type, calc, fn) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}

			if (data.length < 1) {
				return undefined;
			}
	
			let result;

			// special condition for line paths
			if (Array.isArray(data[0])) {

				if (type === "custom") {
					result = data.map(lineData => {
						return lineData.map(datum => [fn(datum), datum[variable]]);
					});
				} else if (type === "constant") {
					if (calc === "add") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] + val, datum[variable]]);
						});
					} else if (calc === "sub") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] - val, datum[variable]]);
						});
					} else if (calc === "mult") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] * val, datum[variable]]);
						});
					} else if (calc === "div") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] / val, datum[variable]]);
						});
					} else {
						console.warn(`DerivedValue calc argument ${calc} not recognized.`);
					}
				} else {
					if (calc === "add") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] + datum[val], datum[variable]]);
						});
					} else if (calc === "sub") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] - datum[val], datum[variable]]);
						});
					} else if (calc === "mult") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] * datum[val], datum[variable]]);
						});
					} else if (calc === "div") {
						result = data.map(lineData => {
							return lineData.map(datum => [datum[variable] / datum[val], datum[variable]]);
						});
					} else {
						console.warn(`DerivedValue calc argument ${calc} not recognized.`);
					}
				}

				if (!result) {
					return undefined
				}

				if (xVar == variable) {
					return data.map((lineData, i) => {
						return lineData.map((d, j) => {
							d.x = xScale(result[i][j][0]);
							d.deltx = xScale(result[i][j][0]) - xScale(result[i][j][1]);
							return d
						})
					});
				} else if (yVar == variable) {
					return data.map((lineData, i) => {
						return lineData.map((d, j) => {
							d.y = yScale(result[i][j][0]);
							d.delty = yScale(result[i][j][0]) - yScale(result[i][j][1]);
							return d
						})
					});
				}

				return undefined;

			}

			// All other mark/data types
			if (type === "custom") {
				result = data.map(datum => [fn(datum), datum[variable]]);
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + val, datum[variable]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - val, datum[variable]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * val, datum[variable]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / val, datum[variable]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + datum[val], datum[variable]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - datum[val], datum[variable]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * datum[val], datum[variable]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / datum[val], datum[variable]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			if (xVar == variable) {
				return data.map((d, i) => {
					d.x = xScale(result[i][0]);
					d.deltx = xScale(result[i][0]) - xScale(result[i][1]);
					return d
				});
			} else if (yVar == variable) {
				return data.map((d, i) => {
					d.y = yScale(result[i][0]);
					d.delty = yScale(result[i][0]) - yScale(result[i][1]);
					return d
				});
			}

			return undefined
		}

	}

	// generator for mark augmentation
	generateLine(variable, val, type, calc, fn) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}

			if (Array.isArray(data[0])) {
				return undefined;
			}
	
			let result;
			let otherVar = xVar === variable ? yVar : xVar;

			if (type === "custom") {
				result = data.map(datum => [fn(datum), datum[variable], datum[otherVar]]);
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + val, datum[variable], datum[otherVar]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - val, datum[variable], datum[otherVar]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * val, datum[variable], datum[otherVar]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / val, datum[variable], datum[otherVar]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => [datum[variable] + datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "sub") {
					result = data.map(datum => [datum[variable] - datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "mult") {
					result = data.map(datum => [datum[variable] * datum[val], datum[variable], datum[otherVar]]);
				} else if (calc === "div") {
					result = data.map(datum => [datum[variable] / datum[val], datum[variable], datum[otherVar]]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			if (xVar === variable) {
				return data.map((d, i) => {
					d.x1 = xScale(result[i][0]);
					d.x2 = xScale(result[i][1]);
					d.y1 = yScale(result[i][2]);
					d.y2 = yScale(result[i][2]);
					return d
				});
			} else if (yVar == variable) {
				return data.map((d, i) => {
					d.y1 = yScale(result[i][0]);
					d.y2 = yScale(result[i][1]);
					d.x1 = xScale(result[i][2]);
					d.x2 = xScale(result[i][2]);
					return d
				});
			}

			return undefined
		}

	}

	generateAxis(variable, val, type, calc, fn) {

		return function(data, xVar, yVar, xScale, yScale) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return undefined;
			}
	
			let result;

			if (type === "custom") {
				result = data.map(datum => fn(datum[variable]));
			} else if (type === "constant") {
				if (calc === "add") {
					result = data.map(datum => datum[variable] + val);
				} else if (calc === "sub") {
					result = data.map(datum => datum[variable] - val);
				} else if (calc === "mult") {
					result = data.map(datum => datum[variable] * val);
				} else if (calc === "div") {
					result = data.map(datum => datum[variable] / val);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			} else {
				if (calc === "add") {
					result = data.map(datum => datum[variable] + datum[val]);
				} else if (calc === "sub") {
					result = data.map(datum => datum[variable] - datum[val]);
				} else if (calc === "mult") {
					result = data.map(datum => datum[variable] * datum[val]);
				} else if (calc === "div") {
					result = data.map(datum => datum[variable] / datum[val]);
				} else {
					console.warn(`DerivedValue calc argument ${calc} not recognized.`);
				}
			}

			if (!result) {
				return undefined
			}

			let resultExtent;

			if (xVar === variable) {
				resultExtent = extent(result);
				return {"x": resultExtent, "y": yScale.domain()};
			} else if (yVar == variable) {
				resultExtent = extent(result);
				return {"x": xScale.domain(), "y": resultExtent};
			}

			return undefined
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let multipleAug = new Aug(`${this._id}_multiple`, "derived_multiple", "mark", {"mark":undefined},
										 this.generateMark(this._variable, this._val, this._type, this._calc, this._fn), 
										 this.mergeStyles(this._customStyles.multiple, markStyles.multiple), this._selection, 1);
		let lineAug = new Aug(`${this._id}_line`, "derived_line", "mark", {"mark":"line"},
								 this.generateLine(this._variable, this._val, this._type, this._calc, this._fn),
								 this.mergeStyles(this._customStyles.line, markStyles.line), this._selection, 2);

		return this._filter([multipleAug.getSpec(), lineAug.getSpec()]).sort(this._sort)
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
}

class Emphasis extends GenerationCriteriaBase {

	// val can either be a single value or list of values
	// type can be "any" or "all", for data in array form
	constructor(variable, val, type="any", styles={}) {

		super();
		
		this._name = "Emphasis";

		this._variable = variable;
		this._val = val;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	// val can either be a single value or list of values
	_generator(variable, val, type) {

		let parseVal = this._parseVal;

		return function(datum, xVar, yVar, xScale, yScale, stats) {

			// If no variable or value defined, emphasize entire selection
			if (!variable || !val) {
				return true;
			}

			let parsed;
			// If val is array of values
			if (Array.isArray(val)) {
				parsed = val.map(v => parseVal(variable, v, xVar, yVar, stats));
			} else {
				parsed = parseVal(variable, val, xVar, yVar, stats);
			}

			function isValid(singleVal) {
				
				// If multiple values to emphasize
				if (Array.isArray(parsed)) {
					if (parsed.indexOf(singleVal) >= 0) {
						return true;
					} else {
						return false;
					}
				} else {
					if (singleVal == parsed) {
						return true;
					}
				}

				return false
			}

			if (Array.isArray(datum)) {
				if (type === "any") {
					return datum.reduce((acc, current) => acc || isValid(current[variable]), false);
				} else {
					return datum.reduce((acc, current) => acc && isValid(current[variable]), true);
				}
			} else {
				return isValid(datum[variable])
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

	// generator for label augmentation
	generateLabel(variable, val, type, stats) {

		let labelFilter = this._generator(variable, val, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let result;

			result = data.filter(d => labelFilter(d, xVar, yVar, xScale, yScale, stats)).map(d => {
				d.x = xScale(d[xVar]);
				d.y = yScale(d[yVar]) - 15;
				// d.text = `${variable} = ${d[variable]}`;
				d.text = `${d[variable]}`;

				return d
			});

			return result;
			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let strokeAug = new Aug(`${this._id}_stroke`, "emphasis_stroke", "encoding", undefined,
								   this._generator(this._variable, this._val, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 1);

		let labelAug = new Aug(`${this._id}_text`, "emphasis_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "emphasis_fill", "encoding", undefined,
								  this._generator(this._variable, this._val, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let opacityAug = new Aug(`${this._id}_opacity`, "emphasis_opacity", "encoding", undefined,
									this._generator(this._variable, this._val, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let regressionAug = new Aug(`${this._id}_regression`, "emphasis_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 5);

		let labelAugs = labelAug.getSpec();
		labelAugs._filter = this._generator(this._variable, this._val, this._type);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._val, this._type);

		return this._filter([strokeAug.getSpec(), labelAugs, fillAug.getSpec(), opacityAug.getSpec(), regressionAugs]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
	}

	updateVal(val) {
		this._val = val;
	}

	// returns a list of [Aug Class]
	// drft can be a single augmentation or a list of augmentations [aug, aug, ...]
	intersect(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id);
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	union(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	symmdiff(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "symmdiff");
			}
		}

		return all_merged
	}

}

// Just add data
class LocalData extends GenerationCriteriaBase {

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

		let markAug = new Aug(`${this._id}_mark`, "local_mark", "mark", {"mark":undefined},
										 this.generateMark(this._local), 
										 this.mergeStyles(this._customStyles.mark, undefined), this._selection, 1);

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

class Range extends GenerationCriteriaBase {

	// Assume val is [min, max]
	constructor(variable, val, type="closed", styles={}) {

		super();

		this._name = "Range";

		this._variable = variable;

		this._min = val[0];
		this._max = val[1];

		this._type = type;

		this._customStyles = styles;

	}

	// generator for encoding type augmentations
	_generator(variable, min, max, type) {

		let parseVal = this._parseVal;

		return function(datum, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do nothing
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsedMin = parseVal(variable, min, xVar, yVar, stats);
			let parsedMax = parseVal(variable, max, xVar, yVar, stats);

			if (parsedMin > parsedMax) {
				return false;
			}

			if (Array.isArray(datum)) {
				if (type === "closed") {
					return datum.reduce((acc, current) => acc && current[variable] >= parsedMin && current[variable] <= parsedMax, true);
				} else if (type === "open") {
					return datum.reduce((acc, current) => acc && current[variable] > parsedMin && current[variable] < parsedMax, true);
				}

			} else {

				if (type === "closed" && datum[variable] >= parsedMin && datum[variable] <= parsedMax) {
					return true;
				} else if (type === "open" && datum[variable] > parsedMin && datum[variable] < parsedMax) {
					return true;
				}

			}

			return false;
		}

	}

	// generator for rect/shading augmentation
	generateRect(variable, min$1, max, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render range rect
			if (xVar != variable && yVar != variable) {
				return [];
			}

			let parsedMin = parseVal(variable, min$1, xVar, yVar, stats);
			let parsedMax = parseVal(variable, max, xVar, yVar, stats);

			if (parsedMin > parsedMax) {
				return false;
			}

			if (xVar == variable) {
				let xMin = min([xScale(parsedMin), xScale(parsedMax)]);
				let width = Math.abs(xScale(parsedMax) - xScale(parsedMin));
				let yMin = min([yScale.range()[1], yScale.range()[0]]);
				let height = Math.abs(yScale.range()[1] - yScale.range()[0]);

				return [{"x": xMin, "width": width, "y":yMin, "height": height}];
			} else if (yVar == variable) {
				let xMin = min([xScale.range()[0], xScale.range()[1]]);
				let width = Math.abs(xScale.range()[1] - xScale.range()[0]);
				let yMin = min([yScale(parsedMin), yScale(parsedMax)]);
				let height = Math.abs(yScale(parsedMax) - yScale(parsedMin));

				return [{"x": xMin, "width": width, "y": yMin, "height": height}];
			}

			return [];
			
		}

	}

	// generator for linear regression augmentation
	generateLinearRegression(variable, min, max, type) {

		let regression = this._findLineByLeastSquares;
		let regressionFilter = this._generator(variable, min, max, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {
			
			let filtered = data.filter(d => regressionFilter(d, xVar, yVar, xScale, yScale, stats));

			let xValues = filtered.map(d => xScale(d[xVar]));
			let yValues = filtered.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return coords;
		}

	}

	// generator for text augmentation
	generateText(variable, min, max, type) {

		let parseVal = this._parseVal;

		return function(data, xVar, yVar, xScale, yScale, stats) {
			// If variable not mapped to x or y position, do not render line
			if (xVar != variable && yVar != variable) {
				return false;
			}

			let parsedMin = parseVal(variable, min, xVar, yVar, stats);
			let parsedMax = parseVal(variable, max, xVar, yVar, stats);

			if (parsedMin > parsedMax) {
				return false;
			}

			if (xVar == variable) {
				return [{"x": xScale(parsedMin) + 5, "y": yScale.range()[1], "text": `  ${parsedMin} ${min != parsedMin ? "("+min+")" : ""}`},
						{"x": xScale(parsedMax) + 5, "y": yScale.range()[1], "text": `  ${parsedMax} ${max != parsedMax ? "("+max+")" : ""}`}];
			} else if (yVar == variable) {
				return [{"x": xScale.range()[0], "y": yScale(parsedMin) - 5, "text": `  ${parsedMin} ${min != parsedMin ? "("+min+")" : ""}`},
						{"x": xScale.range()[0], "y": yScale(parsedMax) + 5, "text": `  ${parsedMax} ${max != parsedMax ? "("+max+")" : ""}`}];
			}
			
		}
 
	}

	// generator for label augmentation
	generateLabel(variable, min, max, type, stats) {

		let labelFilter = this._generator(variable, min, max, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let result;

			result = data.filter(d => labelFilter(d, xVar, yVar, xScale, yScale, stats)).map(d => {
				d.x = xScale(d[xVar]);
				d.y = yScale(d[yVar]) - 15;
				// d.text = `${variable} = ${d[variable]}`;
				d.text = `${d[variable]}`;

				return d
			});

			return result;
			
		}
 
	}

	// returns a list of [Aug Class]
	getAugs() {

		let rectAug = new Aug(`${this._id}_rect`, "range_rect", "mark", {"mark":"rect"},
								 this.generateRect(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.rect, markStyles.rect), this._selection, 1);

		let opacityAug = new Aug(`${this._id}_opacity`, "range_opacity", "encoding", undefined,
									this._generator(this._variable, this._min, this._max, this._type), 
									this.mergeStyles(this._customStyles.opacity, encodingStyles.opacity), this._selection, 2);

		let strokeAug = new Aug(`${this._id}_stroke`, "range_stroke", "encoding", undefined,
								   this._generator(this._variable, this._min, this._max, this._type),
								   this.mergeStyles(this._customStyles.stroke, encodingStyles.stroke), this._selection, 3);

		let fillAug = new Aug(`${this._id}_fill`, "range_fill", "encoding", undefined,
								  this._generator(this._variable, this._min, this._max, this._type),
								  this.mergeStyles(this._customStyles.fill, encodingStyles.fill), this._selection, 4);

		let textAug = new Aug(`${this._id}_text`, "range_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 1);

		let labelAug = new Aug(`${this._id}_label`, "range_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 5);

		let regressionAug = new Aug(`${this._id}_regression`, "range_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._min, this._max, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6);

		let labelAugs = labelAug.getSpec();
		labelAugs._filter = this._generator(this._variable, this._min, this._max, this._type);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._min, this._max, this._type);

		return this._filter([rectAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), labelAugs, regressionAugs]).sort(this._sort)
	}

	updateVariable(variable) {
		this._variable = variable;
		return this;
	}

	updateVal(val) {
		this._min = val[0];
		this._max = val[1];
		return this;
	}

	updateType(type) {
		this._type = type;
		return this;
	}

	// returns a list of [Aug Class]
	// drft can be a single augmentation or a list of augmentations [aug, aug, ...]
	intersect(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id);
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	union(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	symmdiff(drft) {

		let augs = drft;

		if (!Array.isArray(drft)) {
			augs = [drft];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of augs) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "symmdiff");
			}
		}

		return all_merged
	}
	
}

class Regression extends GenerationCriteriaBase {

	// Qn to self: add option of orient? Either variable name provided, or orientation (x/y axis)
	constructor(styles={}) {

		super();
		
		this._name = "Regression";

		this._customStyles = styles;

	}

	// Following function from https://dracoblue.net/dev/linear-least-squares-in-javascript/
	findLineByLeastSquares(values_x, values_y) {
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
    
	    let [x1, x2] = extent(values_x);
	    let [y1, y2] = [x1 * m + b, x2 * m + b];

	    return [[x1, y1], [x2, y2]];
	}

	// generator for line augmentation
	generateLine() {

		let regression = this.findLineByLeastSquares;

		return function(data, xVar, yVar, xScale, yScale) {

			let xValues = data.map(d => xScale(d[xVar]));
			let yValues = data.map(d => yScale(d[yVar]));

			let coords = regression(xValues, yValues);

			return [{"x1":coords[0][0], "y1":coords[0][1], "x2":coords[1][0], "y2":coords[1][1]}];
		}

	}

	// returns a list of [Aug Class]
	getAugs() {

		let lineAug = new Aug(`${this._id}_line`, "regression_line", "mark", {"mark":"line"},
								 this.generateLine(),
								 this.mergeStyles(this._customStyles.regression, markStyles.regression), this._selection, 1);

		return this._filter([lineAug.getSpec()]).sort(this._sort)
	}

}

class Threshold extends GenerationCriteriaBase {

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
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${"le" == type ? "<" : "<="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) + 10, "text": `  ${"le" == type ? "<" : "<="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			} else if (type === "ge" || type === "geq") {
				if (xVar == variable) {
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${"ge" == type ? ">" : ">="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) - 10, "text": `  ${"ge" == type ? ">" : ">="} ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			} else {
				if (xVar == variable) {
					return [{"anchor": "middle", "x": xScale(parsed), "y": yScale.range()[1] - 10, "text": `  ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				} else if (yVar == variable) {
					return [{"x": xScale.range()[0], "y": yScale(parsed) - 10, "text": `  ${parsed} ${val != parsed ? "("+val+")" : ""}`}];
				}
			}

			
		}
 
	}

	// generator for label augmentation
	generateLabel(variable, val, type, stats) {

		let labelFilter = this._generator(variable, val, type);

		return function(data, xVar, yVar, xScale, yScale, stats) {

			let result;

			result = data.filter(d => labelFilter(d, xVar, yVar, xScale, yScale, stats)).map(d => {
				d.x = xScale(d[xVar]);
				d.y = yScale(d[yVar]) - 15;
				// d.text = `${variable} = ${d[variable]}`;
				d.text = `${d[variable]}`;

				return d
			});

			return result;
			
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

		let labelAug = new Aug(`${this._id}_label`, "threshold_label", "mark", {"mark":"text"},
								 this.generateLabel(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.label, markStyles.label), this._selection, 5);

		let textAug = new Aug(`${this._id}_text`, "threshold_text", "mark", {"mark":"text"},
								 this.generateText(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.text, markStyles.text), this._selection, 1);

		let regressionAug = new Aug(`${this._id}_regression`, "threshold_regression", "mark", {"mark":"line"},
								 this.generateLinearRegression(this._variable, this._val, this._type),
								 this.mergeStyles(this._customStyles.regression, markStyles.line), this._selection, 6);

		let labelAugs = labelAug.getSpec();
		labelAugs._filter = this._generator(this._variable, this._val, this._type);

		let regressionAugs = regressionAug.getSpec();
		regressionAugs._filter = this._generator(this._variable, this._val, this._type);

		return this._filter([lineAug.getSpec(), opacityAug.getSpec(), strokeAug.getSpec(), fillAug.getSpec(), textAug.getSpec(), labelAugs, regressionAugs]).sort(this._sort)
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
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

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
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "union");
			}
		}

		return all_merged
	}

	// returns a list of [Aug Class]
	symmdiff(criteria) {

		let allCriteria = criteria;

		if (!Array.isArray(criteria)) {
			allCriteria = [criteria];
		}

		let merged_id = this._id;
		let all_merged = this.getAugs();

		for (let d of allCriteria) {
			if (d._name.startsWith("Threshold") || d._name.startsWith("Emphasis") || d._name.startsWith("Range")) {

				merged_id = `${merged_id}-${d._id}`;

				let new_augs = d.getAugs();
				all_merged = this._mergeAugs(all_merged, new_augs, merged_id, "symmdiff");
			}
		}

		return all_merged
	}
}

export { DerivedValues, Draft, Emphasis, LocalData, Range, Regression, Threshold };
