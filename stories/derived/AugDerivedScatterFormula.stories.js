import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";
import { FormulaBuilder } from "./FormulaBuilder.js";
import Draught from "../../src/lib/Draught.js";
import DerivedValues from "../../src/lib/DerivedValues.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Derived/Scatter/Formula',
};

export const ToStorybook = () => {

	const style = {"multiple":{"fill":"steelblue"}};
	const ref = useRef("constant");
	const chart = useRef(new Draught());
	chart.current.chart(ref.current);
	
	const [formula, setFormula] = useState('return 0;');
	const [data, setData] = React.useState(coffee.slice(0, 15).map(d => {
		d.Rating = d["Total.Cup.Points"] / 10;
		return d;
	}));
	const datapoint = useRef(JSON.parse(JSON.stringify(coffee.slice(0, 10)[0])))
	const newYConstant = useRef(null);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	function updatePlot() {
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
							.domain(data.map(d => d.FIELD1))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							// .domain(d3.extent(data, d => d["Flavor"]))
							.domain([0, d3.max(data, d => d.Rating)])
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Rating"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d.FIELD1) + xScale.bandwidth() / 2)
									.attr("cy", d => yScale(d["Rating"]))
									.attr("r", 6)
									.attr("opacity", 0.3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d.FIELD1) + xScale.bandwidth() / 2;
										let yPos = yScale(d["Rating"]) - 12;

										tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
												.attr("opacity", 1)
												.text(`${d["Rating"]} Expert Rating`);

									})
									.on("mouseout", (event, d) => {

										tooltip.attr("opacity", 0);

									});

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
				  .data(["Rating"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d);

		function alignX(d, i) {
			return xScale(d.FIELD1) + xScale.bandwidth() / 2
		}

		let newStyle = {"line":{"x1":alignX, "x2":alignX, "stroke-dasharray":"2px 5px 5px 5px"}};

		newYConstant.current.updateStyles(newStyle);

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("FIELD1", xScale, xAxis)
					.y("Rating", yScale, yAxis)
					.augment(newYConstant.current.getAugs());
	}

	useEffect(() => {

		if (newYConstant.current) {
			newYConstant.current.updateFunction(new Function('d', formula));
		} else {
			newYConstant.current = new DerivedValues('Rating', undefined, undefined, new Function('d', formula), style);
		}
		
		let newAug2 = newYConstant.current.getAugs();
		chart.current.augment(newAug2);

	}, [formula])

	useEffect(() => {
		
		newYConstant.current = new DerivedValues('Rating', undefined, undefined, new Function('d', formula), style);
		updatePlot()
		let newAug2 = newYConstant.current.getAugs();
		chart.current.augment(newAug2);

	}, [data])

	return (
		<div>
			<div>
				<FormulaBuilder setFormula = {setFormula} dataPoint = {datapoint.current}/>
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
  name: 'Formula',
};