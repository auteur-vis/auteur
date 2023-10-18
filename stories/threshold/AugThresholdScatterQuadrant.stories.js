import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/Quadrant',
};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(8);
	const [yThreshold, setYThreshold] = React.useState(8);
	const [mergeBy, setMergeBy] = useState("xor");

	const ref = useRef("quadrant");
	const chart = useRef(new Draught());
	const newXThreshold = useRef(new Threshold("Aroma", xThreshold, "leq"));
	const newYThreshold = useRef(new Threshold("Flavor", yThreshold, "leq"));

	const [data, setData] = React.useState(coffee);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	function merge(threshold1, threshold2, mergeValue) {

		if (mergeValue === "union") {
			return threshold1.union(threshold2)
		} else if (mergeValue === "intersect") {
			return threshold1.intersect(threshold2)
		} else if (mergeValue === "difference") {
			return threshold1.difference(threshold2)
		} else if (mergeValue === "xor") {
			return threshold1.xor(threshold2)
		}

		return threshold1.getAugs().concat(threshold2.getAugs())

	}

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
					// .charttype("point") // point, bar, line...
					.selection(scatterpoints)
					.x("Aroma", xScale)
					.y("Flavor", yScale)
					// .exclude({"type":["encoding"]})
					.augment(merge(newXThreshold.current, newYThreshold.current, mergeBy));

	}, [data])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);
		let newAugs = merge(newXThreshold.current, newYThreshold.current, mergeBy);

		chart.current.augment(newAugs);

	}, [yThreshold])

	useEffect(() => {

		newXThreshold.current.updateVal(xThreshold);
		let newAugs = merge(newXThreshold.current, newYThreshold.current, mergeBy);

		chart.current.augment(newAugs);

	}, [xThreshold])

	useEffect(() => {

		let newAugs = merge(newXThreshold.current, newYThreshold.current, mergeBy);

		chart.current.augment(newAugs);

	}, [mergeBy])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>x-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="5" max="9"
					step="0.01"
					value={xThreshold}
					onChange={(e) => updateX(e)} />
			</div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="6" max="9"
					step="0.01"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<div>
				<p>merge by: </p>
				<select value={mergeBy} onChange={(e) => setMergeBy(e.target.value)}>
					<option value="union">Union</option>
					<option value="intersect">Intersect</option>
					<option value="difference">Difference</option>
					<option value="xor">xor</option>
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
  name: 'Quadrant',
};