import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/Stacked',
};

export const ToStorybook = () => {

	// console.log(d3.group(cereal, d => d.mfr, d => d.type));

	let series = d3.stack()
					.keys(["C", "H"])
					.value(([, D], key) => D.get(key) ? D.get(key).length : 0)(d3.group(cereal, d => d.mfr, d => d.type));
	let flatten = [];

	for (let t of series) {

		let type = t.key;

		for (let m of t) {

			let mfr = m.data[0];

			flatten.push({"mfr":mfr, "type":type, "0":m[0], "1":m[1], "count":m[1] - m[0]});
		}

	}
	
	const [maxThreshold, setMaxThreshold] = React.useState(5);
	const [minThreshold, setMinThreshold] = React.useState(0);

	const ref = useRef("barstacked");
	const chart = useRef(new Draught());
	const newMaxThreshold = useRef(new Threshold("count", maxThreshold, "le"));
	const newMinThreshold = useRef(new Threshold("count", minThreshold, "ge"));

	const [data, setData] = React.useState(flatten);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svgElement = d3.select(ref.current);

		// create a tooltip
		var tooltip = svgElement.select("#tooltip")
						.attr("text-anchor", "middle")
						.attr("font-family", "sans-serif")
						.attr("font-size", 10)
					    .attr("opacity", 0);

		svgElement.attr("width", layout.width)
				.attr("height", layout.height);

		let xScale = d3.scaleBand()
						.domain(data.map(d => d["mfr"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
						.domain([0, d3.max(data, d => d["1"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["mfr"]) + 1)
							.attr("y", d => yScale(d["1"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => yScale(d["0"]) - yScale(d["1"]))
							.attr("fill", d => d.type === "C" ? "steelblue" : "orange")
							.attr("opacity", 0.25)
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["mfr"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["1"]) - 8;

								tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
										.attr("opacity", 1)
										.text(`${d.count} cereals`);

							})
							.on("mouseout", (event, d) => {

								tooltip.attr("opacity", 0);

							});

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		chart.current.chart(ref.current)
					.selection(bars)
					.x("mfr", xScale)
					.y("count", yScale)
					.exclude({"name":["line", "color", "stroke", "text"]})
					.augment(newMaxThreshold.current.intersect(newMinThreshold.current));

	}, [data])

	useEffect(() => {

		newMaxThreshold.current.updateVal(maxThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [maxThreshold])

	useEffect(() => {

		newMinThreshold.current.updateVal(minThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [minThreshold])

	function updateMax(e) {
		setMaxThreshold(e.target.value);
	}

	function updateMin(e) {
		setMinThreshold(e.target.value);
	}

	let controlStyle = {"display":"flex"};
	let paragraphStyle = {"margin":"3px"};

	return (
		<div>
			<div style={controlStyle}>
				<p style={paragraphStyle}>highlighting cereal types with between </p>
				<input
					type="number"
					id="quantity"
					name="quantity"
					min="0" max="12"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
				<p style={paragraphStyle}>and</p>
				<input
					type="number"
					id="quantity"
					name="quantity"
					min="12" max="23"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
				<p style={paragraphStyle}>products:</p>
			</div>
			<svg id="barless" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<text id="tooltip" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Stacked',
};