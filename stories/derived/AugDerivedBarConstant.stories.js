import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import DerivedValues from "../../src/lib/DerivedValues.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Derived/Bar/Constant',
};

export const ToStorybook = () => {

	const [yConstant, setYConstant] = React.useState(0.5);

	const style = {"markMultiple":{"fill":"steelblue", "opacity":1}};

	const ref = useRef("constant");
	const chart = useRef(new Draught());
	const newYConstant = useRef(new DerivedValues("Flavor", yConstant, "mult", undefined, style));

	const [data, setData] = React.useState(coffee.slice(0, 5));

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
						.domain(data.map(d => d["FIELD1"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
						.domain([0, d3.max(data, d => d["Flavor"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["FIELD1"]) + 1)
							.attr("y", d => yScale(d["Flavor"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => yScale(0) - yScale(d["Flavor"]))
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
					.augment(newYConstant.current.getAugs());

	}, [data])

	useEffect(() => {

		newYConstant.current.updateVal(yConstant);
		let newAug2 = newYConstant.current.getAugs();

		chart.current.augment(newAug2);

	}, [yConstant])

	function updateY(e) {
		setYConstant(e.target.value);
	}

	return (
		<div>
			<div>
				<p>Showing Flavor * {yConstant}: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="0" max="1"
					step="0.1"
					value={yConstant}
					onChange={(e) => updateY(e)} />
			</div>
			<svg id="barless" ref={ref}>
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