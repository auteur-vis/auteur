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
		this._x = scaleX;

		return this;

	}

	y(variable, scaleY) {

		this._yVar = variable;
		this._y = scaleY;

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
							.attr("x1", d => this._x(d["x"]))
							.attr("y1", 0)
							.attr("x2", d => this._x(d["x"]))
							.attr("y2", this._chart.attr("height"))
							.attr("stroke", "black");

			} else if (orient === "y") {

				draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("line")
							.attr("id", aug.id)
							.attr("x1", 0)
							.attr("y1", d => this._y(d["y"]))
							.attr("x2", this._chart.attr("width"))
							.attr("y2", d => this._y(d["y"]))
							.attr("stroke", "black");

			}
		}

	}

	augment(augmentations) {

		for (let a of augmentations) {

			if (a.type === "encoding") {

				let encodings = a.encoding;

				for (let e of Object.keys(encodings)) {

					this._selection.attr(e, d => {

						if (a.generationCriteria(d)) {
							return encodings[e];
						}
						
					});
				}

			} else if (a.type === "mark") {

				// Check that the right x and y variables are used in chart
				let draughtData = a.generationCriteria(this._xVar, this._yVar);

				if (draughtData && a.encoding.mark === "line") {

					this._handleLine(a, draughtData);

				}

			}

		}

	}

}