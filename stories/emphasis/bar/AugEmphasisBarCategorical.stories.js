import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../../src/lib/Draft.js";
import Emphasis from "../../../src/lib/Emphasis.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Bar/Categorical',
};

export const ToStorybook = () => {

	const [emphVal, setEmphVal] = React.useState("Other");
	const [emphVar, setEmphVar] = React.useState("Variety");
	const [emphOptions, setEmphOptions] = React.useState(Array.from(new Set(coffee.map(d => d.Variety))));

	const ref = useRef("emphVal");
	const chart = useRef(new Draft());
	const newEmphasis = useRef(new Emphasis(emphVar, emphVal));

	const [data, setData] = React.useState(coffee.slice(0, 10));
	console.log(data)

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	let yScale;
	function updatePlot() {

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
						.domain(data.map(d => d["FIELD1"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		yScale = d3.scaleLinear()
						.domain([d3.min(data, d => d.Flavor) - 0.5, d3.max(data, d => d["Flavor"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["FIELD1"]) + 1)
							.attr("y", d => yScale(d["Flavor"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => layout.height - layout.marginBottom - yScale(d["Flavor"]))
							.attr("fill", "steelblue")
							.attr("opacity", "0.5")
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["FIELD1"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["Flavor"]) - 8;

								tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
										.attr("opacity", 1)
										.text(`${d.Flavor} Flavor`);

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
					.selection(bars)
					.x("FIELD1", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["line"]})
					//.augment(newYConstant.current.getAugs());

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
				.data(["Flavor"])
				.join("text")
				.attr("id", "yTitle")
				.attr("text-anchor", "middle")
				.attr("transform", `translate(0, 40)`)
				.attr("fill", "black")
				.text(d => d);
	}

	useEffect(() => {

		
	updatePlot()
	chart.current.augment(newEmphasis.current.getAugs());

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