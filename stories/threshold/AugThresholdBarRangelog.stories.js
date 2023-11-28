import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/RangeLog',
};

export const ToStorybook = () => {

	let group = d3.group(coffee, d => d["Country"]);
	let groupedData = [...group.entries()].map(d => { return {"Country":d[0], "entries":d[1], "count":d[1].length} }).sort((a, b) => a.count - b.count);
	
	const style = {"fill":{"fill":"#8f48a3"}};

	const [maxThreshold, setMaxThreshold] = React.useState(65);
	const [minThreshold, setMinThreshold] = React.useState(29);

	const ref = useRef("barrange");
	const chart = useRef(new Draft());
	const newMaxThreshold = useRef(new Threshold("count", maxThreshold, "leq", style));
	const newMinThreshold = useRef(new Threshold("count", minThreshold, "geq", style));

	const [data, setData] = React.useState(groupedData);

	let layout={"width":900,
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
						.domain(data.map(d => d["Country"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLog()
						.domain([5, d3.max(data, d => d["count"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["Country"]) + 1)
							.attr("y", d => yScale(d["count"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => yScale(5) - yScale(d["count"]))
							.attr("fill", "steelblue")
							.attr("fill-opacity", 0.25)
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["Country"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["count"]) - 8;

								tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
										.attr("opacity", 1)
										.text(`${d.count} coffees`);

							})
							.on("mouseout", (event, d) => {

								tooltip.attr("opacity", 0);

							});

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		chart.current.chart(ref.current)
					.selection(bars)
					.x("Country", xScale)
					.y("count", yScale)
					.include({"name":["line", "fill", "text"]})
					.augment(newMaxThreshold.current.intersect(newMinThreshold.current));

	}, [data])

	useEffect(() => {

		newMaxThreshold.current.updateVal(maxThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [maxThreshold])

	useEffect(() => {

		newMinThreshold.current.updateVal(minThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [minThreshold])

	function updateMax(e) {
		setMaxThreshold(e.target.value);
	}

	function updateMin(e) {
		setMinThreshold(e.target.value);
	}

	let controlStyle = {"display":"flex"};

	return (
		<div>
			<div style={controlStyle}>
				<p>min coffees: 0</p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="5" max={d3.max(data, d => d.count)}
					step="0.5"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
				<p>65</p>
			</div>
			<div style={controlStyle}>
				<p>max coffees: 65</p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="65" max="236"
					step="0.5"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
				<p>236</p>
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
  name: 'RangeLog',
};