import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Point/Calculated',
};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(d3.mean(cereal, d => d.calories));
	const [yStatistic, setYStatistic] = useState("mean");

	const ref = useRef("calculated");
	const chart = useRef(new Draught());
	const newYThreshold = useRef(new Threshold("calories", yThreshold, "leq"));

	const [data, setData] = React.useState(cereal);

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
							.domain(d3.extent(data, d => d["sugars"]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["calories"]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["calories"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d["sugars"]) + Math.random() * 8 - 4)
									.attr("cy", d => yScale(d["calories"]) + Math.random() * 8 - 4)
									.attr("r", d => 3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d["sugars"]);
										let yPos = yScale(d["calories"]) - 8;

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

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("sugars", xScale)
					.y("calories", yScale)
					.augment(newYThreshold.current.getAugs());

	}, [data])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);

		let newAug2 = newYThreshold.current.getAugs();

		chart.current.augment(newAug2);

	}, [yThreshold])

	useEffect(() => {

		if (yStatistic === "min") {
			setYThreshold(Math.round(d3.min(cereal, d => d.calories)));
		} else if (yStatistic === "mean") {
			setYThreshold(Math.round(d3.mean(cereal, d => d.calories)));
		} else if (yStatistic === "median") {
			setYThreshold(Math.round(d3.median(cereal, d => d.calories)));
		} else if (yStatistic === "max") {
			setYThreshold(Math.round(d3.max(cereal, d => d.calories)));
		}

	}, [yStatistic])

	function updateY(e) {
		setYStatistic(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y statistic: </p>
				<select value={yStatistic} onChange={(e) => updateY(e)}>
					<option value="min">Min</option>
					<option value="mean">Mean</option>
					<option value="median">Median</option>
					<option value="max">Max</option>
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
  name: 'Calculated',
};