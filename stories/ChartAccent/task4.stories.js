import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Regression from "../../src/lib/Regression.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import cars from "../../public/chartaccent_mpg.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/ChartAccent/Task4',
};

export const ToStorybook = () => {

	const ref = useRef("task4");

	const [data, setData] = React.useState(cars.map(d => {
		if (d.Cylinders === "7-8 Cyl.") {
			d.CylindersGroup = "High";
		} else if (d.Cylinders === "5-6 Cyl.") {
			d.CylindersGroup = "Mid";
		} else {
			d.CylindersGroup = "Low";
		} 

		return d
	}));

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

		const cylinders = Array.from(new Set(data.map(d => d.Cylinders)));

		let colorScale = d3.scaleOrdinal(d3.schemeSet2)
							.domain(cylinders);

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

		let legend = svgElement.select("#legend")
							.selectAll(".legendCircle")
							.data(cylinders)
							.join("circle")
							.attr("class", "legendCircle")
							.attr("cx", (d, i) => layout.width - 100)
							.attr("cy", (d, i) => layout.marginTop + 16 * i)
							.attr("r", 5)
							.attr("fill", d => colorScale(d))

		let legendText = svgElement.select("#legend")
							.selectAll(".legendText")
							.data(cylinders)
							.join("text")
							.attr("class", "legendText")
							.attr("x", (d, i) => layout.width - 100 + 16)
							.attr("y", (d, i) => layout.marginTop + 16 * i + 3)
							.attr("fill", "black")
							.attr("text-anchor", "start")
							.attr("font-family", "sans-serif")
							.attr("font-size", "10")
							.text(d => d)

		let scatterpoints = svgElement.select("#mark")
							.selectAll(".carPoints")
							.data(data)
							.join("circle")
							.attr("class", d => `carPoints ${d.CylindersGroup}`)
							.attr("cx", d => xScale(d.MPG))
							.attr("cy", d => yScale(d.Displacement))
							.attr("r", 3)
							.attr("opacity", 0.25)
							.attr('fill', d => colorScale(d.Cylinders));

		const regression1 = new Regression();
		const regression2 = new Regression();
		const regression3 = new Regression();

		regression1.select(".High");
		regression2.select(".Mid");
		regression3.select(".Low");

		regression1.updateStyles({"regression":{"stroke":colorScale("7-8 Cyl.")}});
		regression2.updateStyles({"regression":{"stroke":colorScale("5-6 Cyl.")}});
		regression3.updateStyles({"regression":{"stroke":colorScale("3-4 Cyl.")}});

		draft.current.chart("#svg")
			.selection(scatterpoints)
			.x("MPG", xScale)
			.y("Displacement", yScale)
			.augment(regression1.getAugs())
			.augment(regression2.getAugs())
			.augment(regression3.getAugs());

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
  name: 'Task4',
};