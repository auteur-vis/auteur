import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../../src/lib/Draft.js";
import Emphasis from "../../../src/lib/Emphasis.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Scatter/Categorical',
};

export const ToStorybook = () => {

	const [emphVal, setEmphVal] = React.useState("Other");
	const [emphVar, setEmphVar] = React.useState("Variety");
	const [emphOptions, setEmphOptions] = React.useState(Array.from(new Set(coffee.map(d => d.Variety))));

	const ref = useRef("emphVal");
	const chart = useRef(new Draft());
	const newEmphasis = useRef(new Emphasis(emphVar, emphVal));

	const [data, setData] = React.useState(coffee);

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
							.domain(d3.extent(data, d => d["Aroma"]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d["Aroma"]) + Math.random() * 8 - 4)
									.attr("cy", d => yScale(d["Flavor"]) + Math.random() * 8 - 4)
									.attr("r", d => 3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d["Aroma"]);
										let yPos = yScale(d["Flavor"]) - 8;

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

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["Aroma"])
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
				  .data(["Flavor"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("Aroma", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["text"]})
					.augment(newEmphasis.current.getAugs());

	}, [data])

	useEffect(() => {

		let newEmphOptions = Array.from(new Set(coffee.map(d => d[emphVar])));
		setEmphOptions(newEmphOptions);
		setEmphVal(newEmphOptions[0]);

		newEmphasis.current.updateVariable(emphVar);

	}, [emphVar])

	useEffect(() => {

		newEmphasis.current.updateVal(emphVal);
		let newAugs = newEmphasis.current.getAugs();

		chart.current.augment(newAugs);

	}, [emphVal])

	function updateEmphVar(e) {
		setEmphVar(e.target.value);
	}

	function updateEmphVal(e) {
		setEmphVal(e.target.value);
	}

	let controlStyle = {"display":"flex"};
	let paragraphStyle = {"margin":"3px"};

	return (
		<div>
			<div style={controlStyle}>
				<p style={paragraphStyle}>Highlight variable </p>
				<select value={emphVar} onChange={(e) => updateEmphVar(e)}>
					<option value="Country">Country</option>
					<option value="Color">Color</option>
					<option value="Variety">Variety</option>
				</select>
				<p style={paragraphStyle}>when value is: </p>
				<select value={emphVal} onChange={(e) => updateEmphVal(e)}>
					{emphOptions.map((d, i) => {
						return <option value={d} key={`option${i}`}>{d}</option>
					})}
				</select>
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
  name: 'Categorical',
};