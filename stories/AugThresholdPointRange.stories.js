import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Point/Range',
};

export const ToStorybook = () => {

	const [maxThreshold, setMaxThreshold] = React.useState(135);
	const [minThreshold, setMinThreshold] = React.useState(80);

	const ref = useRef("range");
	const chart = useRef(new Draught());
	const newMaxThreshold = useRef(new Threshold("calories", maxThreshold, "leq"));
	const newMinThreshold = useRef(new Threshold("calories", minThreshold, "geq"));

	const [data, setData] = React.useState(cereal);

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

		let xScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["sugars"]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["calories"]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["calories"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d["sugars"]) + Math.random() * 8 - 4)
									.attr("cy", d => yScale(d["calories"]) + Math.random() * 8 - 4)
									.attr("r", d => 3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d["sugars"]);
										let yPos = yScale(d["calories"]) - 8;

										tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
												.attr("opacity", 1)
												.text(d.name);

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
					// .charttype("point") // point, bar, line...
					.selection(scatterpoints)
					.x("sugars", xScale)
					.y("calories", yScale)
					// .exclude({"type":["encoding"]})
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
					min="110" max="160"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
			</div>
			<div>
				<p>min threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="50" max="110"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
			</div>
			<svg id="less" ref={ref}>
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