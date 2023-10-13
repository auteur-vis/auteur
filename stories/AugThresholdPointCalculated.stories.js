import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../src/lib/Draught.js";
import Threshold from "../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Point/Calculated',
};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(d3.mean(coffee, d => d.Flavor));
	const [yStatistic, setYStatistic] = useState("mean");

	const ref = useRef("calculated");
	const chart = useRef(new Draught());
	const newYThreshold = useRef(new Threshold("Flavor", yThreshold, "eq"));

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

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d["Aroma"]) + Math.random() * 8 - 4)
									.attr("cy", d => yScale(d["Flavor"]) + Math.random() * 8 - 4)
									.attr("r", d => 3)
									.attr("fill", "none")
									.attr("stroke", "steelblue")
									.on("mouseover", (event, d) => {

										let xPos = xScale(d["Aroma"]);
										let yPos = yScale(d["Flavor"]) - 8;

										tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
												.attr("opacity", 1)
												.text(d["Country"]);

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
					.augment(newYThreshold.current.getAugs());

	}, [data])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);

		let newAug2 = newYThreshold.current.getAugs();

		chart.current.augment(newAug2);

	}, [yThreshold])

	useEffect(() => {

		if (yStatistic === "min") {
			setYThreshold(d3.min(coffee, d => d.Flavor));
		} else if (yStatistic === "mean") {
			setYThreshold(d3.mean(coffee, d => d.Flavor));
		} else if (yStatistic === "median") {
			setYThreshold(d3.median(coffee, d => d.Flavor));
		} else if (yStatistic === "max") {
			setYThreshold(d3.max(coffee, d => d.Flavor));
		}

	}, [yStatistic])

	function updateY(e) {
		setYStatistic(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y-statistic: </p>
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