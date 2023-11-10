import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import DerivedValues from "../../src/lib/DerivedValues.js";

import study from "../../public/study_data.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Study/Line/20Percent',
};

export const ToStorybook = () => {

	const ref = useRef("lineless");

	const chart = useRef(new Draught());
	const newValues = useRef(new DerivedValues("Revenue", 0.8, "mult"));

	// ... some code omitted ...

	const [data, setData] = React.useState(study.All);

	let layout={"width":900,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svgElement = d3.select(ref.current);

		const dataGroup = data.map((d) => {
			d.Revenue = d["Revenue (in thousands)"];
			return d;
		});

		let grouped = d3.group(dataGroup, d => d.Store);

		// create a tooltip
		var tooltip = svgElement.select("#tooltip")
						.attr("text-anchor", "middle")
						.attr("font-family", "sans-serif")
						.attr("font-size", 10)
					    .attr("opacity", 0);

		svgElement.attr("width", layout.width)
				.attr("height", layout.height);

		let xScale = d3.scaleLinear()
					.domain(d3.extent(dataGroup, d => d["Month"]))
					.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain([0, d3.max(dataGroup, d => d["Revenue"])])
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(dataGroup, d => d["Revenue"]))
							.range([3, 6]);

		let colorScale = d3.scaleOrdinal(d3.schemeTableau10)
							.domain(Array.from(new Set(dataGroup)));

		let lineFunction = d3.line()
							 .x(d => xScale(d["Month"]))
							 .y(d => yScale(d["Revenue"]));

		let flattenGroup = [...grouped].map(d => {
			return d[1].map(di => {di.Store = d[0]; return di});
			return d[1]
		});

		let lines = svgElement.select("#mark")
									.selectAll(".climateLine")
									.data(flattenGroup)
									.join("path")
									.attr("class", "climateLine")
									.attr('fill', 'none')
									.attr('stroke-width', 2)
									.attr("stroke", d => "black")
									.attr("d", d => {
										return lineFunction(d)
									})

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["Month"])
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
				  .data(["Revenue"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		svgElement.select("#legend").selectAll("#legendText")
				  .data(["After 20% Tax"])
				  .join("text")
				  .attr("id", "legendText")
				  .attr("text-anchor", "end")
				  .attr("alignment-baseline", "middle")
				  .attr("transform", `translate(200, 60)`)
				  .attr("fill", "black")
				  .attr("font-family", "sans-serif")
				  .attr("font-size", "12px")
				  .text(d => d)

		svgElement.select("#legend").selectAll("#legendLine")
				  .data(["After 20% Tax"])
				  .join("line")
				  .attr("id", "legendLine")
				  .attr("x1", 210)
				  .attr("y1", 60)
				  .attr("x2", 280)
				  .attr("y2", 60)
				  .attr("stroke", "red")
				  .attr("stroke-width", "2px")
				  .attr("stroke-dasharray", "5px 5px 2px 5px");

		// ... some code omitted ...

		const styles = {"multiple": {"stroke":"red", "stroke-width": "2px", "stroke-dasharray": "20px"}};

		newValues.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(lines)
					.x("Month", xScale)
					.y("Revenue", yScale)
					.exclude({"name":["fill", "opacity", "text"]})
					.augment(newValues.current.getAugs());

	}, [data])

	return (
		<div>
			<svg id="less" ref={ref}>
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
  name: '20Percent',
};