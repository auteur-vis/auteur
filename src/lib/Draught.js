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

	_handleLine(aug, data) {

		let draughtLayer = this._chart.select("#draughty");

		if (data.length === 1) {
			let orient = data[0]["x"] ? "x" : "y";

			if (orient === "x") {

				draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("line")
							.attr("id", aug.id)
							.attr("x1", d => d["x"])
							.attr("y1", 0)
							.attr("x2", d => d["x"])
							.attr("y2", this._chart.attr("height"))
							.attr("stroke", "black");

			} else if (orient === "y") {

				draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("line")
							.attr("id", aug.id)
							.attr("x1", 0)
							.attr("y1", d => d["y"])
							.attr("x2", this._chart.attr("width"))
							.attr("y2", d => d["y"])
							.attr("stroke", "black");

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

	augment(augmentations) {

		let filteredAugs = augmentations;

		// rank is exactly the same for both include and exclude
		if (this._exclude && this._exclude["rank"]) {

			filteredAugs = filteredAugs.filter(d => d.rank <= this._exclude["rank"]);

		} else if (this._include && this._include["rank"]) {

			filteredAugs = filteredAugs.filter(d => d.rank <= this._include["rank"]);

		}

		for (let a of filteredAugs) {

			if (this._exclude && this._exclude["type"]) {

				if (this._exclude["type"].indexOf(a.type) >= 0) {
					continue
				}

			} else if (this._include && this._include["type"]) {

				if (this._include["type"].indexOf(a.type) === -1) {
					continue
				}

			}

			if (this._exclude && this._exclude["name"]) {

				if (this._exclude["name"].indexOf(a.name.split("_")[1]) >= 0) {
					continue
				}

			} else if (this._include && this._include["name"]) {

				if (this._include["name"].indexOf(a.name.split("_")[1]) === -1) {
					continue
				}

			}

			if (a.type === "encoding") {

				let encodings = a.encoding;

				for (let e of Object.keys(encodings)) {

					if (e === "opacity") {

						this._selection.style(e, d => {

							if (a.generator(d)) {
								return encodings[e];
							} else {
								return 0.25
							}
							
						});

					} else {

						this._selection.style(e, d => {

							if (a.generator(d)) {
								return encodings[e];
							}
							
						});

					}
					
				}

			} else if (a.type === "mark") {

				// Check that the right x and y variables are used in chart
				let draughtData = a.generator(this._xVar, this._yVar, this._xScale, this._yScale);

				if (draughtData && a.encoding.mark === "line") {

					this._handleLine(a, draughtData);

				} else if (draughtData && a.encoding.mark === "text") {

					this._handleText(a, draughtData);

				}

			}

		}

	}

}