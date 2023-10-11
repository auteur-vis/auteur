import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Point/Multi',
};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(8);
	const [yThreshold, setYThreshold] = React.useState(115);

	const ref = useRef("multi");
	const chart = useRef(new Draught());
	const newXThreshold = useRef(new Threshold("sugars", xThreshold, "leq"));
	const newYThreshold = useRef(new Threshold("calories", yThreshold, "leq"));

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
					.selection(scatterpoints)
					.x("sugars", xScale)
					.y("calories", yScale)
					.exclude({"type":["encoding"]})
					.augment(newYThreshold.current.getAugs().concat(newXThreshold.current.getAugs()));

	}, [data])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);

		let xAugs = newXThreshold.current.getAugs();
		let yAugs = newYThreshold.current.getAugs();

		let newAugs = xAugs.concat(yAugs);

		chart.current.augment(newAugs);

	}, [yThreshold])

	useEffect(() => {

		newXThreshold.current.updateVal(xThreshold);

		let xAugs = newXThreshold.current.getAugs();
		let yAugs = newYThreshold.current.getAugs();

		let newAugs = xAugs.concat(yAugs);

		chart.current.augment(newAugs);

	}, [xThreshold])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>x-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="0" max="15"
					value={xThreshold}
					onChange={(e) => updateX(e)} />
			</div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="60" max="160"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
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
  name: 'Multi',
};