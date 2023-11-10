import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../../src/lib/Draught.js";
import Emphasis from "../../../src/lib/Emphasis.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Scatter/List',
};

export const ToStorybook = () => {

	const [emphVal1, setEmphVal1] = React.useState("Other");
	const [emphVal2, setEmphVal2] = React.useState("Bourbon");

	const options = Array.from(new Set(coffee.map(d => d.Variety)));

	const ref = useRef("emphVal");
	const chart = useRef(new Draught());
	const newEmphasis = useRef(new Emphasis("Variety", [emphVal1, emphVal2]));

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
				  .text(d => d);

		let colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
							.domain(d3.extent(data, d => d["Flavor"]));

		const styles = {"fill": {"fill": (d, i) => colorScale(d.Flavor)}};

		newEmphasis.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("Aroma", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["text"]})
					.augment(newEmphasis.current.getAugs());

	}, [data])

	useEffect(() => {

		let newEmphVals = [emphVal1, emphVal2];
		newEmphasis.current.updateVal(newEmphVals);
		
		let newAugs = newEmphasis.current.getAugs();
		chart.current.augment(newAugs);

	}, [emphVal1, emphVal2])

	function updateEmphVal1(e) {
		setEmphVal1(e.target.value);
	}

	function updateEmphVal2(e) {
		setEmphVal2(e.target.value);
	}

	let controlStyle = {"display":"flex"};
	let paragraphStyle = {"margin":"3px"};

	return (
		<div>
			<div style={controlStyle}>
				<p style={paragraphStyle}>Highlight varieties </p>
				<select value={emphVal1} onChange={(e) => updateEmphVal1(e)}>
					{options.map((d, i) => {
						return <option value={d} key={`option1${i}`}>{d}</option>
					})}
				</select>
				<p style={paragraphStyle}> and </p>
				<select value={emphVal2} onChange={(e) => updateEmphVal2(e)}>
					{options.map((d, i) => {
						return <option value={d} key={`option2${i}`}>{d}</option>
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
  name: 'List',
};