import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Threshold from "../../src/lib/Threshold.js";

import study from "../../public/study_data.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Study/Bar/Prior360',
};

export const ToStorybook = () => {

	let group = d3.group(study.All, d => d["Store"]);
	let groupedData = [...group.entries()].map(d => { return {"Store":d[0], "entries":d[1], "Revenue":d3.sum(d[1], d => d["Revenue (in thousands)"])} });

	const ref = useRef("barless");
	const chart = useRef(new Draught());
	const newBarThreshold = useRef(new Threshold("Revenue", 360, "geq"));

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
						.domain(data.map(d => d["Store"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
						.domain([0, d3.max(data, d => d["Revenue"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["Store"]) + 25)
							.attr("y", d => yScale(d["Revenue"]))
							.attr("width", xScale.bandwidth() - 50)
							.attr("height", d => yScale(0) - yScale(d["Revenue"]))
							.attr("fill", "#e3715f")
							.attr("stroke", "black")
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["Store"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["Revenue"]) - 8;

								tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
										.attr("opacity", 1)
										.text(`${d.Revenue} coffees`);

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

		let style = {"fill": {"fill":"#84a15f"}, "line":{"stroke-dasharray": "20px", "stroke-width": "2px"}};

		newBarThreshold.current.updateStyles(style);

		chart.current.chart(ref.current)
					.selection(bars)
					.x("Store", xScale)
					.y("Revenue", yScale)
					.exclude({"name":["opacity"]})
					.augment(newBarThreshold.current.getAugs());

	}, [data])

	return (
		<div>
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
  name: 'Prior360',
};