import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import DerivedValues from "../../src/lib/DerivedValues.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Derived/Scatter/Constant',
};

export const ToStorybook = () => {

	const [yConstant, setYConstant] = React.useState(5);

	const style = {"markMultiple":{"fill":"steelblue"}};

	const ref = useRef("constant");
	const chart = useRef(new Draught());

	function myDerivedValue(d) {
		return d.Flavor - d.Aroma / 2 - d.Balance / 3;
	}

	const newYConstant = useRef(new DerivedValues("Flavor", undefined, undefined, myDerivedValue, style));

	const [data, setData] = React.useState(coffee.slice(0, 10));

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
							.domain(data.map(d => d.FIELD1))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							// .domain(d3.extent(data, d => d["Flavor"]))
							.domain([0, 10])
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d.FIELD1) + xScale.bandwidth() / 2)
									.attr("cy", d => yScale(d["Flavor"]))
									.attr("r", 6)
									.attr("opacity", 0.3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d.FIELD1) + xScale.bandwidth() / 2;
										let yPos = yScale(d["Flavor"]) - 12;

										tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
												.attr("opacity", 1)
												.text(`${d.Flavor} Rating`);

									})
									.on("mouseout", (event, d) => {

										tooltip.attr("opacity", 0);

									});

		let xAxis = svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["FIELD1 (ID)"])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		let yAxis = svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		svgElement.select("#yAxis").selectAll("#yTitle")
				  .data(["Rating"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d);

		function alignX(d, i) {
			return xScale(d.FIELD1) + xScale.bandwidth() / 2
		}

		let newStyle = {"line":{"x1":alignX, "x2":alignX, "stroke-dasharray":"2px 5px 5px 5px"}};

		newYConstant.current.updateStyles(newStyle);

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("FIELD1", xScale, xAxis)
					.y("Flavor", yScale, yAxis)
					.augment(newYConstant.current.getAugs());

	}, [data])

	// useEffect(() => {

	// 	newYConstant.current.updateVal(yConstant);
	// 	let newAug2 = newYConstant.current.getAugs();

	// 	chart.current.augment(newAug2);

	// }, [yConstant])

	// function updateY(e) {
	// 	setYConstant(e.target.value);
	// }

	// <div>
	// 			<p>Showing Flavor - {yConstant}: </p>
	// 			<input
	// 				type="number"
	// 				id="quantity"
	// 				name="quantity"
	// 				min="0" max="10"
	// 				step="1"
	// 				value={yConstant}
	// 				onChange={(e) => updateY(e)} />
	// 		</div>

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
  name: 'Constant',
};