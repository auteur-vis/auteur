import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/Flavor',
};

export const ToStorybook = () => {
	const style = {"fill":{"fill":"steelblue"},
				   "line":{"stroke-dasharray":"2px 5px 5px 5px"}};

	const ref = useRef("range");
	const chart = useRef(new Draft());
	const newThreshold = useRef(new Threshold("Flavor", 8, "leq", style));
	const [data, setData] = React.useState(coffee.slice(15, 30));

	let layout={"width":900,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svgElement = d3.select(ref.current);

		svgElement.attr("width", layout.width)
				.attr("height", layout.height);

		let xScale = d3.scaleBand()
						.domain(data.map(d => d["FIELD1"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
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
							.attr("opacity", "0.5");

		svgElement.select("#xAxis")
					.call(d3.axisBottom(xScale))
					.attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#yAxis")
					.call(d3.axisLeft(yScale).ticks(5))
					.attr("transform", `translate(${layout.marginLeft}, 0)`);

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

		let newAugs = newThreshold.current.getAugs();

		chart.current.chart(ref.current)
					.selection(bars)
					.x("FIELD1", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["regression"]})
					.augment(newAugs);

	}, [data])

	return (
		<div>
			<svg id="less" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<text id="tooltip" />
				<g id="augmentations" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Flavor',
};