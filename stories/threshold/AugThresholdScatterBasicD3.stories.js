import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/BasicD3',
};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(8);

	const ref = useRef("less");

	// ... some code omitted ...

	const [data, setData] = React.useState(coffee);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svg = d3.select(ref.current);

		// create a tooltip
		var tooltip = svg.select("#tooltip")
						.attr("text-anchor", "middle")
						.attr("font-family", "sans-serif")
						.attr("font-size", 10)
					    .attr("opacity", 0);

		svg.attr("width", layout.width)
				.attr("height", layout.height);

		let xScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Aroma"]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([3, 6]);

		let thresholdValue = 7.5;

		let scatterpoints = svg.select("#mark")
								.selectAll("circle")
								.data(data)
								.join("circle")
								.attr("cx", d => xScale(d["Aroma"]))
								.attr("cy", d => yScale(d["Flavor"]))
								.attr("r", 3)
								.attr("opacity", d => d.Flavor >= thresholdValue ? 1 : 0.25)
								.attr("fill", d => d.Flavor >= thresholdValue ? "red" : "steelblue")
								.attr("stroke", d => d.Flavor >= thresholdValue ? "black" : "none");

		let thresholdLine = svg.select("#mark")
								.selectAll("line")
								.data([thresholdValue])
								.join("line")
								.attr("x1", xScale.range()[0])
								.attr("y1", yScale(thresholdValue))
								.attr("x2", xScale.range()[1])
								.attr("y2", yScale(thresholdValue))
								.attr("stroke", "black");

		let thresholdText = svg.select("#mark")
								.selectAll("text")
								.data([thresholdValue])
								.join("text")
								.attr("x", xScale.range()[0])
								.attr("y", yScale(thresholdValue) + 10)
								.attr("alignment-baseline", "hanging")
								.attr("font-family", "sans-serif")
								.attr("font-size", 11)
								.text(d => `Flavor greater than or equal to ${d}`);

		svg.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svg.select("#xAxis").selectAll("#xTitle")
				  .data(["Aroma"])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		svg.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		svg.select("#yAxis").selectAll("#yTitle")
				  .data(["Flavor"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

	}, [data])

	return (
		<div>
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
  name: 'BasicD3',
};