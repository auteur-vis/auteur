import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import cars from "../../public/chartaccent_mpg.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/ChartAccent/Task6',
};

export const ToStorybook = () => {

	const ref = useRef("task6");

	const [data, setData] = React.useState(cars);

	const threshold = useRef(new Threshold("MPG", "mean", "geq"));

	let layout={"width":600,
	   		   "height":350,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	const draft = useRef(new Draft());

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
					.domain(d3.extent(data, d => d["MPG"]))
					.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
					.domain(d3.extent(data, d => d["Displacement"]))
					.range([layout.height - layout.marginBottom, layout.marginTop]);

		let colorScale = d3.scaleOrdinal(d3.schemeSet2)
							.domain(Array.from(new Set(data.map(d => d.CylindersGroup))));

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["MPG"])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		svgElement.select("#yAxis").selectAll("#yTitle")
				  .data(["Displacement"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		let scatterpoints = svgElement.select("#mark")
							.selectAll(".carPoints")
							.data(data)
							.join("circle")
							.attr("class", d => `carPoints ${d.CylindersGroup}`)
							.attr("cx", d => xScale(d.MPG))
							.attr("cy", d => yScale(d.Displacement))
							.attr("r", 3)
							.attr('fill', "steelblue");

		draft.current.chart("#svg")
			.selection(scatterpoints)
			.x("MPG", xScale)
			.y("Displacement", yScale)
			.include({"name":["fill", "stroke", "line", "text"]})
			.augment(threshold.current.getAugs());

	}, [data])

	return (
		<div>
			<svg id="svg" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<text id="tooltip" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Task6',
};