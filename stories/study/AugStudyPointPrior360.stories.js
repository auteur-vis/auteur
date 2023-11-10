import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

import study from "../../public/study_data.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Study/Point/Prior360',
};

export const ToStorybook = () => {

	let group = d3.group(study.All, d => d["Store"]);
	let groupedData = [...group.entries()].map(d => { return {"Store":d[0], "entries":d[1], "Revenue":d3.sum(d[1], d => d["Revenue (in thousands)"])} });

	const ref = useRef("barless");
	const chart = useRef(new Draft());
	const newPointThreshold = useRef(new Threshold("Revenue", 360, "eq"));
	const maxPointThreshold = useRef(new Threshold("Revenue", d3.max(groupedData, d => d.Revenue), "eq"));

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
						.domain([100, 450])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let points = svgElement.select("#mark")
							.selectAll(".point")
							.data(data)
							.join("circle")
							.attr("class", "point")
							.attr("cx", d => xScale(d["Store"]) + xScale.bandwidth() / 2)
							.attr("cy", d => yScale(d["Revenue"]))
							.attr("r", 10)
							.attr("fill", "gray")
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

		let style = {"line":{"stroke-dasharray": "20px", "stroke-width": "3px"}};
		let styleMax = {"fill": {"fill":"steelblue"}, "line":{"stroke-dasharray": "20px", "stroke-width": "3px", "stroke":"steelblue"}};

		newPointThreshold.current.updateStyles(style);
		maxPointThreshold.current.updateStyles(styleMax).exclude({"name":["text"]});

		chart.current.chart(ref.current)
					.selection(points)
					.x("Store", xScale)
					.y("Revenue", yScale)
					.exclude({"name":["opacity", "stroke"]})
					.augment(newPointThreshold.current.getAugs())
					.augment(maxPointThreshold.current.getAugs());

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