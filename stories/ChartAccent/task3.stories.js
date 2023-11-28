import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Range from "../../src/lib/Range.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import air from "../../public/chartaccent_airquality.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/ChartAccent/Task3',
};

export const ToStorybook = () => {

	const ref = useRef("task3");

	const [data, setData] = React.useState(air);

	let layout={"width":650,
	   		   "height":350,
	   		   "marginTop":50,
	   		   "marginRight":100,
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

		let xScale = d3.scalePoint()
					.domain(data.map(d => d["Day"]))
					.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
					.domain([0, 450])
					.range([layout.height - layout.marginBottom, layout.marginTop]);

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["Day"])
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
				  .data(["PM2.5 Index"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		let lineFunction = d3.line()
							 .x(d => xScale(d["Day"]))
							 .y(d => yScale(d[" PM2_5"]));

		let lines = svgElement.select("#mark")
							.selectAll(".airLine")
							.data([data])
							.join("path")
							.attr("class", "airLine")
							.attr('fill', 'none')
							.attr('stroke-width', 1.5)
							.attr("stroke", "steelblue")
							.attr("d", d => {
								return lineFunction(d)
							});

		const style1 = {"rect":{"fill":"green", "opacity": 0.2},
						"text":{"text":"Light", "x":layout.marginLeft + 5}};

		const style2 = {"rect":{"fill":"orange", "opacity": 0.2},
						"text":{"text":"Moderate", "x":layout.marginLeft + 5}};

		const style3 = {"rect":{"fill":"red", "opacity": 0.2},
						"text":{"text":"Severe", "x":layout.marginLeft + 5}};

		const range1 = new Range(" PM2_5", [0, 150], "closed", style1);
		const range2 = new Range(" PM2_5", [150, 300], "closed", style2);
		const range3 = new Range(" PM2_5", [300, 450], "closed", style3);

		const draft = new Draft();
		draft.chart("#svg")
			.selection(lines)
			.x("Day", xScale)
			.y(" PM2_5", yScale)
			.include({"name":["rect", "text"]})
			.augment(range1.getAugs())
			.augment(range2.getAugs())
			.augment(range3.getAugs());

	}, [data])

	return (
		<div>
			<svg id="svg" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<g id="legend" />
				<text id="tooltip" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Task3',
};