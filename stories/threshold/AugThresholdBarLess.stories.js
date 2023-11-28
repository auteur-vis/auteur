import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/Less',
};

export const ToStorybook = () => {

	let group = d3.group(coffee, d => d["Country"]);
	let groupedData = [...group.entries()].map(d => { return {"Country":d[0], "entries":d[1], "count":d[1].length} }).sort((a, b) => a.count - b.count);
	
	const [barThreshold, setBarThreshold] = React.useState(150);
	const [barOperation, setBarOperation] = useState("leq");

	const ref = useRef("barless");
	const chart = useRef(new Draft());
	const newBarThreshold = useRef(new Threshold("count", barThreshold, barOperation));

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

		let yScale = d3.scaleLinear()
						.domain([0, d3.max(data, d => d["count"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["Country"]) + 1)
							.attr("y", d => yScale(d["count"]))
							.attr("width", xScale.bandwidth() - 2)
							.attr("height", d => yScale(0) - yScale(d["count"]))
							.attr("fill", "steelblue")
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
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		chart.current.chart(ref.current)
					.selection(bars)
					.x("Country", xScale)
					.y("count", yScale)
					.exclude({"name":["fill", "stroke"]})
					.augment(newBarThreshold.current.getAugs());

	}, [data])

	useEffect(() => {

		newBarThreshold.current.updateVal(barThreshold);
		let newAug2 = newBarThreshold.current.getAugs();

		chart.current.augment(newAug2);

	}, [barThreshold])

	useEffect(() => {

		newBarThreshold.current.updateType(barOperation);
		let newAugs = newBarThreshold.current.getAugs();

		chart.current.augment(newAugs);

	}, [barOperation])

	function updateY(e) {
		setBarThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="0" max="236"
					value={barThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<div>
				<p>y-axis operation: </p>
				<select value={barOperation} onChange={(e) => setBarOperation(e.target.value)}>
					<option value="eq">Equals</option>
					<option value="le">Less Than</option>
					<option value="leq">Less Than or Equals To</option>
					<option value="ge">Greater Than</option>
					<option value="geq">Greater Than or Equals To</option>
				</select>
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
  name: 'Less',
};