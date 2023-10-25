import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/Multi',
};

export const ToStorybook = () => {

	const [maxThreshold, setMaxThreshold] = React.useState(7.5);
	const [minThreshold, setMinThreshold] = React.useState(6.5);
	const [xThreshold, setXThreshold] = React.useState(7.6);

	const style = {"fill":{"fill":"steelblue"},
				   "line":{"stroke-dasharray":"2px 5px 5px 5px"}};

	const ref = useRef("range");
	const chart = useRef(new Draught());
	const newMaxThreshold = useRef(new Threshold("Flavor", maxThreshold, "leq", style));
	const newMinThreshold = useRef(new Threshold("Flavor", minThreshold, "geq", style));
	const newXThreshold = useRef(new Threshold("Aroma", xThreshold, "leq", style));

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
									.attr("opacity", 0.25)
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
					// .charttype("point") // point, bar, line...
					.selection(scatterpoints)
					.x("Aroma", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["stroke", "opacity"]})
					.augment(newMaxThreshold.current.intersect([newMinThreshold.current, newXThreshold.current]));

	}, [data])

	useEffect(() => {

		newMaxThreshold.current.updateVal(maxThreshold);
		let newAugs = newMaxThreshold.current.intersect([newMinThreshold.current, newXThreshold.current]);

		chart.current.augment(newAugs);

	}, [maxThreshold])

	useEffect(() => {

		newMinThreshold.current.updateVal(minThreshold);
		let newAugs = newMaxThreshold.current.intersect([newMinThreshold.current, newXThreshold.current]);

		chart.current.augment(newAugs);

	}, [minThreshold])

	useEffect(() => {

		newXThreshold.current.updateVal(xThreshold);
		let newAugs = newMaxThreshold.current.intersect([newMinThreshold.current, newXThreshold.current]);

		chart.current.augment(newAugs);

	}, [xThreshold])

	function updateMax(e) {
		setMaxThreshold(e.target.value);
	}

	function updateMin(e) {
		setMinThreshold(e.target.value);
	}

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>max y-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Flavor)}
					max={d3.max(data, d => d.Flavor)}
					step="0.01"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
			</div>
			<div>
				<p>min y-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Flavor)}
					max={d3.max(data, d => d.Flavor)}
					step="0.01"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
			</div>
			<div>
				<p>x-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Aroma)}
					max={d3.max(data, d => d.Aroma)}
					step="0.01"
					value={xThreshold}
					onChange={(e) => updateX(e)} />
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
  name: 'Multi',
};