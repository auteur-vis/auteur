// import React, {useRef, useState, useEffect} from "react";
// import * as d3 from "d3";

import { min as d3min, mean as d3mean, quantileSorted as d3quantileSorted, ascending as d3ascending} from "d3-array";
import { select as d3select, selectAll as d3selectAll } from "d3-selection";
import { line as d3line } from "d3-shape";

import { v4 as uuidv4 } from 'uuid';

export default class Draft {

	constructor() {

		this._id = `chart${uuidv4()}`;

		this._include = null;
		this._exclude = null;

		this._layer;

		this._data = [];
		this._serialize = [{},{}];

	}

	chart(el) {

		this._chart = d3select(el);
		this._chart.append("g").attr("id", "draughty");

		return this;

	}
 
	layer(selector) {
		this._layer = selector;

		return this;
	}

	// Select elements by selector (e.g. class)
	// Use either this or selection()
	// serialize determines whether the data will be converted to serial regex
	select(selector, serialize = false) {

		this._selector = selector;
		this._selection = this._chart.selectAll(selector);
		this._data = this._selection.data();
		this._stats = this._getStats(this._data);
		this._serialize = this._getSerialize(this._data);

		return this;

	}

	// Elements already selected
	// Use either this or select()
	selection(selected, serialize = false) {

		this._selection = selected;
		this._data = selected.data();
		this._stats = this._getStats(this._data);
		this._serialize = this._getSerialize(this._data);

		return this;

	}

	// Optional, overrides selection data with local data
	data(data, serialize = false) {

		this._data = data;
		this._serialize = this._getSerialize(this._data);

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
						.attr("id", aug.id)
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
						.attr("id", aug.id)
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
				)} else {
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
						.attr("id", aug.id)
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
												return d3line()
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
												return d3line()
													.x(di => this._xScale(di[this._xVar]))
													.y(di => di.y)(d);
											});

			} else {

				newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
											.data(data)
											.join(
												enter => enter.append((d, i) => clone ? elements[i].cloneNode(true) : elements[0].cloneNode(true)))
											.attr("d", (d, i) => {
												return d3line()
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

	_getSerialize(data) {

		// hardcoding this may be for the best
		let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

		if (!data || data.length === 0) {
			return [{},{}];
		}

		let variables = Object.keys(data[0]);
		let variableSerialized = {};
		let variableSerializedKeys = {};

		for (let v of variables) {

			let variableValues = data.map(d => d[v]);
			let uniqueVariableValues = Array.from(new Set(variableValues));

			let uniqueVariableValuesMap = {};

			let variableType = "number";
			let firstType;

			// check if variable is numeric or categorical or other
			for (let uvi = 0; uvi <= uniqueVariableValues.length; uvi++) {

				let uv = uniqueVariableValues[uvi];

				if (uv === undefined || uv === null) {
					continue
				} else {
					if (!firstType) {
						firstType = typeof uv
						uniqueVariableValuesMap[uv] = alphabet[uvi];
					} else if (firstType != typeof uv) {
						uniqueVariableValuesMap = {};
						break
					} else {
						// If too many unique values, raise warning
						// Reset to none
						if (uvi >= alphabet.length) {
							uniqueVariableValuesMap = {};
						} else {
							uniqueVariableValuesMap[uv] = alphabet[uvi];
						}
					}
				}

			}

			if (Object.keys(uniqueVariableValuesMap).length > 0) {
				// Save the serialization keys
				variableSerializedKeys[v] = uniqueVariableValuesMap;
				// Save the serialized string
				variableSerialized[v] = variableValues.map(d => uniqueVariableValuesMap[d]).join("");
			} else {
				variableSerializedKeys[v] = {};
				variableSerialized[v] = {};
			}

		}

		// variableSerialized is each variable converted into a string, with a unique letter for each unique variable value
		// variableSerializedKeys stores the mapping between letter and value for each variable
		return [variableSerialized, variableSerializedKeys]

	}

	_getStats(data) {

		if (data.length === 0) {
			return {};
		}

		let variables = Object.keys(data[0]);

		let variableStats = {};

		for (let v of variables) {

			let mean = this._round(d3mean(data, d => d[v]));

			// If median cannot be calculated, assume categorical variable
			if (!mean) {
				continue
			} else {
				
				let sorted = data.map(d => d[v]).sort(d3ascending);

				let median = this._round(d3quantileSorted(sorted, 0.5));

				let Q3 = this._round(d3quantileSorted(sorted, 0.75));
				let Q1 = this._round(d3quantileSorted(sorted, 0.25));

				let min = sorted[0];
				let max = sorted[sorted.length - 1];

				// Outlier lower and upper bounds
				let lowerBound = this._round(Q1 - 1.5 * (Q3 - Q1));
				let upperBound = this._round(Q3 + 1.5 * (Q3 - Q1));

				variableStats[v] = {"min": min,
									"Q1": Q1,
									"mean": mean,
									"median": median,
									"Q3": Q3,
									"max": max,
									"lowerBound": lowerBound,
									"upperBound": upperBound}
			}

		}

		return variableStats

	}

	augment(augmentations) {

		let filteredAugs = augmentations;
		let draughtLayer = this._chart.select(this._layer ? this._layer : "#draughty");

		if (augmentations.length === 0) {

			d3.selectAll(`${this._layer ? this._layer : "#draughty"} > *`).remove();

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
			let serialize = (a.selection && a.selection.size() > 0) ? this._getSerialize(selectData) : this._serialize;
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

			let filteredIndices = a.aggregator(selectData, this._xVar, this._yVar, this._xScale, this._yScale, stats, serialize[0], serialize[1]);
			// Handle augmentations that change encoding(s)
			if (a.type === "encoding") {
				
				let [name, encoding] = a.name.split("_");
				let styles = a.styles;

				for (let s of Object.keys(styles)) {

					// Local selections override global selections
					if (this._selection) {this._selection.style(s, undefined)};

					if (!s.startsWith(encoding)) {continue;}

					if (s === "opacity") {

						select.style(s, (d, i, n) => {

							if (name === "sequence") {

								if (a.generator(i, filteredIndices, this._xVar, this._yVar, this._xScale, this._yScale, stats)) {

									let customStyle = styles[s];

									if (typeof customStyle === "function") {
										return customStyle(d, i)
									} else {
										return customStyle
									}
								} else {
									return 0.25;
								}
							} else {
								if (a.generator(i, filteredIndices)) {

									let customStyle = styles[s];

									if (typeof customStyle === "function") {
										return customStyle(d, i)
									} else {
										return customStyle
									}
								} else {
									return 0.25;
								}
							}
							
						});

					} else {

						select.style(s, (d, i) => {

							if (name === "sequence") {

								if (a.generator(i, filteredIndices, this._xVar, this._yVar, this._xScale, this._yScale, stats)) {
									let customStyle = styles[s];

									if (typeof customStyle === "function") {
										return customStyle(d, i)
									} else {
										return customStyle
									}
								}
							} else {
								if (a.generator(i, filteredIndices)) {

									let customStyle = styles[s];

									if (typeof customStyle === "function") {
										return customStyle(d, i)
									} else {
										return customStyle
									}
								}
							}
							
						});

					}
					
				}

			} else if (a.type === "mark") {

				// Handle augmentations that add marks

				// Check that the right x and y variables are used in chart
				let draughtData = a.generator(selectData, filteredIndices, this._xVar, this._yVar, this._xScale, this._yScale, stats);

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