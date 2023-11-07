import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Emphasis from "../../src/lib/Emphasis.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import climate from "../../public/climate.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Line/Value',
};

export const ToStorybook = () => {

	const [yValue, setYValue] = React.useState("New York");

	const ref = useRef("lineless");

	const chart = useRef(new Draught());
	const newYEmphasis = useRef(new Emphasis("City", yValue));

	// ... some code omitted ...

	const [data, setData] = React.useState(climate.filter(d => d.year > 2005));

	let layout={"width":900,
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
							.range([3, 6]);

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
									.attr("stroke", "black")
									.attr('stroke-width', 1)
									.attr("d", d => {
										return lineFunction(d)
									})

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

		const styles = {"stroke": {"stroke": (d, i) => colorScale(d[0].City), "stroke-width": "3px"}};

		newYEmphasis.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(lines)
					.x("date", xScale)
					.y("AverageTemperature", yScale)
					.exclude({"name":["fill", "opacity"]})
					.augment(newYEmphasis.current.getAugs());

	}, [data])

	useEffect(() => {

		newYEmphasis.current.updateVal(yValue);
		let newAug2 = newYEmphasis.current.getAugs();
		
		chart.current.augment(newAug2);

	}, [yValue])

	function updateY(e) {
		setYValue(e.target.value);
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
					value={yValue}
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
  name: 'Value',
};