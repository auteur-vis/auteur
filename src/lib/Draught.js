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

		if (data.length >= 1) {
			let orient = data[0]["x1"] ? "x" : "y";

			let newLines;

			if (orient === "x") {

				newLines = draughtLayer.selectAll(`#${aug.id}`)
											.data(data)
											.join("line")
											.attr("id", aug.id)
											.attr("x1", d => d["x1"])
											.attr("y1", d => d["y1"])
											.attr("x2", d => d["x2"])
											.attr("y2", d => d["y2"]);

			} else if (orient === "y") {

				newLines = draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("line")
							.attr("id", aug.id)
							.attr("x1", d => d["x1"])
							.attr("y1", d => d["y1"])
							.attr("x2", d => d["x2"])
							.attr("y2", d => d["y2"]);

			}

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

	_handleText(aug, data) {

		let draughtLayer = this._chart.select("#draughty");

		let newText;

		if (data.length >= 1) {
			let orient = data[0]["x"] ? "x" : "y";

			if (orient === "x") {

				newText = draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("text")
							.attr("id", aug.id)
							.attr("x", d => d.x)
							.attr("y", d => d.y)
							.attr("font-family", "sans-serif")
							.attr("font-size", 11)
							.attr("alignment-baseline", "hanging")
							.text(d => d["text"]);

			} else if (orient === "y") {

				newText = draughtLayer.selectAll(`#${aug.id}`)
							.data(data)
							.join("text")
							.attr("id", aug.id)
							.attr("x", d => d.x)
							.attr("y", d => d.y)
							.attr("font-family", "sans-serif")
							.attr("font-size", 11)
							.attr("alignment-baseline", "middle")
							.text(d => d["text"]);

			}

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
			draughtLayer.selectAll(`#${aug.id}`)
						.data(data)
						.join("text")
						.attr("id", aug.id)
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

	// _handleAxes(newAxisExtents) {
	// 	console.log("handling axes...")

	// 	let xScale = this._xScale;
	// 	let yScale = this._yScale;

	// 	let xScaleApplied = this._xScaleApplied;
	// 	let yScaleApplied = this._yScaleApplied;

	// 	let xExtents = newAxisExtents.x;
	// 	let yExtents = newAxisExtents.y;

	// 	if (xExtents.length === 0 && yExtents.length === 0) {return};

	// 	let newXMin = d3.min(xExtents.map(d => d[0]));
	// 	let newXMax = d3.max(xExtents.map(d => d[1]));
	// 	let [oldXMin, oldXMax] = xScale.domain();

	// 	let newXExtent = [newXMin < oldXMin ? newXMin : oldXMin, newXMax > oldXMax ? newXMax : oldXMax];
	// 	let newXScale = xScale.copy().domain(newXExtent);

	// 	let newYMin = d3.min(yExtents.map(d => d[0]));
	// 	let newYMax = d3.max(yExtents.map(d => d[1]));
	// 	let [oldYMin, oldYMax] = yScale.domain();

	// 	let newYExtent = [newYMin < oldYMin ? newYMin : oldYMin, newYMax > oldYMax ? newYMax : oldYMax];
	// 	let newYScale = yScale.copy().domain(newYExtent);

	// 	// Augmented elements
	// 	let childrenSelection = this._chart.selectAll("#draughty").selectAll("*");
	// 	let children = childrenSelection.nodes();

	// 	// Selected elements
	// 	let selected = this._selection;
	// 	let selectedNodes = selected.nodes();

	// 	// Some scale cannot be inverted, e.g. scaleBand()
	// 	// Ignore for now
	// 	if (xScaleApplied.invert) {
	// 		childrenSelection.attr("cx", (d, i) => children[i].cx ? newXScale(xScaleApplied.invert(children[i].cx.baseVal.value)) : undefined)
	// 						 .attr("x", (d, i) => children[i].x ? newXScale(xScaleApplied.invert(children[i].x.baseVal.value)) : undefined)
	// 						 .attr("x1", (d, i) => children[i].x1 ? newXScale(xScaleApplied.invert(children[i].x1.baseVal.value)) : undefined)
	// 						 .attr("x2", (d, i) => children[i].x2 ? newXScale(xScaleApplied.invert(children[i].x2.baseVal.value)) : undefined)
	// 						 .attr("width", (d, i) => children[i].width ? newXScale(xScaleApplied.invert(children[i].width.baseVal.value)) : undefined)

	// 		selected.attr("cx", (d, i) => selectedNodes[i].cx ? newXScale(xScaleApplied.invert(selectedNodes[i].cx.baseVal.value)) : undefined)
	// 				 .attr("x", (d, i) => selectedNodes[i].x ? newXScale(xScaleApplied.invert(selectedNodes[i].x.baseVal.value)) : undefined)
	// 				 .attr("x1", (d, i) => selectedNodes[i].x1 ? newXScale(xScaleApplied.invert(selectedNodes[i].x1.baseVal.value)) : undefined)
	// 				 .attr("x2", (d, i) => selectedNodes[i].x2 ? newXScale(xScaleApplied.invert(selectedNodes[i].x2.baseVal.value)) : undefined)
	// 				 .attr("width", (d, i) => selectedNodes[i].width ? newXScale(xScaleApplied.invert(selectedNodes[i].width.baseVal.value)) : undefined)

	// 		this._xScaleApplied = newXScale;
	// 	}

	// 	if (yScaleApplied.invert) {
	// 		console.log(children, children[0], children[0].cy, children[0].cy.baseVal, children[0].cy.baseVal.value);

	// 		childrenSelection.attr("cy", (d, i, n) => { 
	// 								console.log("n", d3.select(n[i]).attr("cy"));
	// 								children[i].cy ? console.log("cy", children[i].getAttribute("cy"), yScaleApplied.invert(children[i].cy.baseVal.value)) : undefined;
	// 								return children[i].cy ? newYScale(yScaleApplied.invert(children[i].cy.baseVal.value)) : undefined
	// 							})
	// 						 .attr("y", (d, i) => children[i].y ? newYScale(yScaleApplied.invert(children[i].y.baseVal.value)) : undefined)
	// 						 .attr("y1", (d, i) => children[i].y1 ? newYScale(yScaleApplied.invert(children[i].y1.baseVal.value)) : undefined)
	// 						 .attr("y2", (d, i) => children[i].y2 ? newYScale(yScaleApplied.invert(children[i].y2.baseVal.value)) : undefined)
	// 						 .attr("height", (d, i) => children[i].height ? newYScale(yScaleApplied.invert(children[i].height.baseVal.value)) : undefined)

	// 		selected.attr("cy", (d, i) => selectedNodes[i].cy ? newYScale(yScaleApplied.invert(selectedNodes[i].cy.baseVal.value)) : undefined)
	// 				 .attr("y", (d, i) => selectedNodes[i].y ? newYScale(yScaleApplied.invert(selectedNodes[i].y.baseVal.value)) : undefined)
	// 				 .attr("y1", (d, i) => selectedNodes[i].y1 ? newYScale(yScaleApplied.invert(selectedNodes[i].y1.baseVal.value)) : undefined)
	// 				 .attr("y2", (d, i) => selectedNodes[i].y2 ? newYScale(yScaleApplied.invert(selectedNodes[i].y2.baseVal.value)) : undefined)
	// 				 .attr("height", (d, i) => selectedNodes[i].height ? newYScale(yScaleApplied.invert(selectedNodes[i].height.baseVal.value)) : undefined)

	// 		this._yScaleApplied = newYScale;
	// 	}

	// }

	augment(augmentations) {

		let filteredAugs = augmentations;

		// first filter by rank
		// rank filtering is exactly the same for both include and exclude
		if (this._exclude && this._exclude["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._exclude["rank"]);
		} else if (this._include && this._include["rank"]) {
			filteredAugs = filteredAugs.filter(d => d.rank <= this._include["rank"]);
		}

		let newAxisExtents = {"x": [], "y": []};

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

			}
			// else if (a.type === "axis") {

			// 	let newAxes = a.generator(this._data, this._xVar, this._yVar, this._xScale, this._yScale);

			// 	// Keep track of new extents, but process them all at the end
			// 	if (newAxes) {
			// 		newAxisExtents.x.push(newAxes.x);
			// 		newAxisExtents.y.push(newAxes.y);
			// 	}

			// }

		}

		// this._handleAxes(newAxisExtents);

	}

}