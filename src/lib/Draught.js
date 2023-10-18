// import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import { v4 as uuidv4 } from 'uuid';

export default class Draught {

	constructor() {

		this._id = `chart${uuidv4()}`;
		this._defaultStyles = {"line": {"stroke":"black",
									     "stroke-width":1,
									     "stroke-dasharray":"none"},
								"point":{"fill":"black",
										 "r":3,
										 "stroke":"none"},
								"bar":{"fill":"steelblue",
									   "stroke":"none"}
								}

		this._include = null;
		this._exclude = null;

	}

	chart(el) {

		this._chart = d3.select(el);
		this._chart.append("g").attr("id", "draughty");

		return this;

	}

	// Select elements by selector (e.g. class)
	// Use either this or selection()
	select(selector) {

		this._selector = selector;
		this._selection = this._chart.selectAll(selector);
		this._data = this._selection.data();

		return this;

	}

	// Elements already selected
	// Use either this or select()
	selection(selected) {

		this._selection = selected;
		this._data = selected.data();

		return this;

	}

	// Optional, overrides selection data with local data
	data(data) {

		this._data = data;

		return this;

	}

	x(variable, scaleX, el=undefined) {

		this._xVar = variable;
		this._xScale = scaleX;
		this._xAxisEl = el;

		return this;

	}

	y(variable, scaleY, el=undefined) {

		this._yVar = variable;
		this._yScale = scaleY;
		this._yAxisEl = el;

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

	_handleLine(aug, data) {

		let draughtLayer = this._chart.select("#draughty");

		let orient = data[0]["x1"] ? "x" : "y";

		if (orient === "x") {

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

		} else if (orient === "y") {

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

		}

	}

	_handleText(aug, data) {

		let draughtLayer = this._chart.select("#draughty");

		if (data.length === 1) {
			let orient = data[0]["x"] ? "x" : "y";

			if (orient === "x") {

				draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("text")
							.attr("id", aug.id)
							.attr("x", d => d["x"])
							.attr("y", 10)
							.attr("font-family", "sans-serif")
							.attr("font-size", 11)
							.attr("alignment-baseline", "hanging")
							.text(d => d["text"]);

			} else if (orient === "y") {

				draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("text")
							.attr("id", aug.id)
							.attr("x", 0)
							.attr("y", d => d["y"])
							.attr("font-family", "sans-serif")
							.attr("font-size", 11)
							.attr("alignment-baseline", "middle")
							.text(d => d["text"]);

			}
		}

	}

	_handleMultiple(aug, data) {

		let draughtLayer = this._chart.select("#draughty");
		let elements = this._selection.nodes();

		let orient = data[0]["x"] ? "x" : "y";

		if (orient === "x") {

			let newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
										.data(data)
										.join(
											enter => enter.append((d, i) => elements[i].cloneNode(true)))
										.attr("class", `${aug.id}_multiple`)
										.attr("cx", (d, i) => elements[i].cx ? elements[i].cx.baseVal.value + d.deltx : undefined)
										.attr("x", (d, i) => elements[i].x ? elements[i].x.baseVal.value + d.deltx : undefined)
										.attr("width", (d, i) => elements[i].width ? elements[i].width.baseVal.value + d.deltx : undefined);

			for (let s of Object.keys(aug.styles)) {
				newMultiples.attr(s, aug.styles[s]);
			}

		} else if (orient === "y") {

			let newMultiples = draughtLayer.selectAll(`.${aug.id}_multiple`)
										.data(data)
										.join(
											enter => enter.append((d, i) => elements[i].cloneNode(true)))
										.attr("class", `${aug.id}_multiple`)
										.attr("cy", (d, i) => elements[i].cy ? elements[i].cy.baseVal.value + d.delty : undefined)
										.attr("y", (d, i) => elements[i].y ? elements[i].y.baseVal.value + d.delty : undefined)
										.attr("height", (d, i) => elements[i].height ? elements[i].height.baseVal.value - d.delty : undefined);

			for (let s of Object.keys(aug.styles)) {
				newMultiples.attr(s, aug.styles[s]);
			}

		}

	}

	augment(augmentations) {

		let filteredAugs = augmentations;

		// first filter by rank
		// rank filtering is exactly the same for both include and exclude
		if (this._exclude && this._exclude["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._exclude["rank"]);
		} else if (this._include && this._include["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._include["rank"]);
		}

		for (let a of filteredAugs) {

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

					if (!s.startsWith(encoding)) {continue;}

					if (s === "opacity") {

						this._selection.style(s, d => {

							if (a.generator(d)) {
								return styles[s];
							} else {
								return 0.25
							}
							
						});

					} else {

						this._selection.style(s, d => {

							if (a.generator(d)) {
								return styles[s];
							}
							
						});

					}
					
				}

			} else if (a.type === "mark") {
				// Handle augmentations that add marks

				// Check that the right x and y variables are used in chart
				let draughtData = a.generator(this._data, this._xVar, this._yVar, this._xScale, this._yScale);

				if (draughtData && a.encoding.mark === "line") {
					// Add a line mark (single straight line)
					this._handleLine(a, draughtData);
				} else if (draughtData && a.encoding.mark === "text") {
					// Add a text mark
					this._handleText(a, draughtData);
				} else if (draughtData && !a.encoding.mark) {
					// If no mark specified, create multiple of existing mark(s)
					this._handleMultiple(a, draughtData);
				}

			} else if (a.type === "axis") {

				let newAxes = a.generator(this._data, this._xVar, this._yVar, this._xScale, this._yScale);

				if (this._xAxisEl) {
					this._xAxisEl.call(newAxes[0]);
				}

				if (this._yAxisEl) {
					this._yAxisEl.call(newAxes[1]);
				}

			}

		}

	}

}