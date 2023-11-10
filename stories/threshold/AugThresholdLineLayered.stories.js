import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import climate from "../../public/climate.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Line/Layer',
};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(8);

	const ref = useRef("linelayer");

	const chart = useRef(new Draft());
	const lineYThreshold = useRef(new Threshold("AverageTemperature", yThreshold, "geq"));
	const pointYThreshold = useRef(new Threshold("AverageTemperature", yThreshold, "geq"));

	// ... some code omitted ...

	const [data, setData] = React.useState(climate.filter(d => d.year > 2010));

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svgElement = d3.select(ref.current);

		const dataTime = data.map((d) => {
			let dateSplit = d.dt.split("-");
			let formatDate = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]);
			d.date = formatDate;
			return d;
		})

		let grouped = d3.group(dataTime, d => d.City);

		// create a tooltip
		var tooltip = svgElement.select("#tooltip")
						.attr("text-anchor", "middle")
						.attr("font-family", "sans-serif")
						.attr("font-size", 10)
					    .attr("opacity", 0);

		svgElement.attr("width", layout.width)
				.attr("height", layout.height);

		let xScale = d3.scaleTime()
					.domain(d3.extent(dataTime, d => d["date"]))
					.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(dataTime, d => d["AverageTemperature"]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(dataTime, d => d["AverageTemperature"]))
							.range([2, 4]);

		let colorScale = d3.scaleOrdinal(d3.schemeTableau10)
							.domain(['Chicago', 'Los Angeles', 'New York']);

		let lineFunction = d3.line()
							 .x(d => xScale(d["date"]))
							 .y(d => yScale(d["AverageTemperature"]));

		let flattenGroup = [...grouped].map(d => {
			return d[1].map(di => {di.City = d[0]; return di});
			return d[1]
		});

		let lines = svgElement.select("#mark")
									.selectAll(".climateLine")
									.data(flattenGroup)
									.join("path")
									.attr("class", "climateLine")
									.attr('fill', 'none')
									.attr('stroke-width', 1.5)
									.attr("stroke", d => colorScale(d[0].City))
									.attr("d", d => {
										return lineFunction(d)
									})

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".climatePoints")
									.data(data)
									.join("circle")
									.attr("class", "climatePoints")
									.attr("cx", d => xScale(d.date))
									.attr("cy", d => yScale(d.AverageTemperature))
									.attr("r", d => sizeScale(d.AverageTemperature))
									.attr("fill", "white")
									.attr("stroke", d => colorScale(d.City));

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["date"])
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
				  .data(["Average Temperature"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		// ... some code omitted ...

		const lineStyles = {"stroke": {"stroke": (d, i) => colorScale(d[0].City), "stroke-width": "2px"}};
		const pointStyles = {"stroke": {"stroke": (d, i) => colorScale(d.City), "stroke-width": "2px"}};

		lineYThreshold.current.updateStyles(lineStyles)
							.selection(lines);

		pointYThreshold.current.updateStyles(pointStyles)
							   .selection(scatterpoints);

		chart.current.chart(ref.current)
					.x("date", xScale)
					.y("AverageTemperature", yScale)
					.exclude({"name":["fill", "text"]})
					.augment(lineYThreshold.current.exclude({"name": ["line", "text"]}).getAugs())
					.augment(pointYThreshold.current.getAugs());

	}, [data])

	useEffect(() => {

		lineYThreshold.current.updateVal(yThreshold);
		pointYThreshold.current.updateVal(yThreshold);
		
		chart.current
			.augment(lineYThreshold.current.getAugs())
			.augment(pointYThreshold.current.getAugs());

	}, [yThreshold])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="-5" max="25"
					step="0.01"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
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
  name: 'Layer',
};