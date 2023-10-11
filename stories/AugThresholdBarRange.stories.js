import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/Range',
};

export const ToStorybook = () => {

	let group = d3.group(cereal, d => d["mfr"]);
	let groupedData = [...group.entries()].map(d => { return {"mfr":d[0], "entries":d[1], "count":d[1].length} }).sort((a, b) => a.count - b.count);
	
	const [maxThreshold, setMaxThreshold] = React.useState(17);
	const [minThreshold, setMinThreshold] = React.useState(7);

	const ref = useRef("barrange");
	const chart = useRef(new Draught());
	const newMaxThreshold = useRef(new Threshold("count", maxThreshold, "leq"));
	const newMinThreshold = useRef(new Threshold("count", minThreshold, "geq"));

	const [data, setData] = React.useState(groupedData);

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
						.domain([0, d3.max(data, d => d["count"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["mfr"]) + 1)
							.attr("y", d => yScale(d["count"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => yScale(0) - yScale(d["count"]))
							.attr("fill", "steelblue")
							.attr("fill-opacity", 0.25)
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["mfr"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["count"]) - 8;

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
					.include({"name":["line", "stroke", "text"]})
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

	return (
		<div>
			<div>
				<p>max threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="12" max="23"
					step="0.5"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
			</div>
			<div>
				<p>min threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="0" max="12"
					step="0.5"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
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
  name: 'Range',
};