import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Range from "../../src/lib/Range.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Range/Scatter/Multi',
};

export const ToStorybook = () => {

	const [maxXThreshold, setMaxXThreshold] = React.useState(8);
	const [minXThreshold, setMinXThreshold] = React.useState(7.5);

	const [maxYThreshold, setMaxYThreshold] = React.useState(7.5);
	const [minYThreshold, setMinYThreshold] = React.useState(6.5);

	const ref = useRef("rangeMulti");
	const chart = useRef(new Draught());
	const newXRange = useRef(new Range("Aroma", [minXThreshold, maxXThreshold], "open"));
	const newYRange = useRef(new Range("Flavor", [minYThreshold, maxYThreshold], "closed"));

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

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d["Flavor"]))
							.range([3, 6]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d["Aroma"]))
									.attr("cy", d => yScale(d["Flavor"]))
									.attr("r", d => 3)
									.attr("opacity", 0.25);

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
					// .exclude({"name":["opacity"]})
					.augment(newXRange.current.union(newYRange.current));

	}, [data])

	useEffect(() => {

		newXRange.current.updateVal([minXThreshold, maxXThreshold]);
		let newAugs = newXRange.current.union(newYRange.current);

		chart.current.augment(newAugs);

	}, [minXThreshold, maxXThreshold])

	function updateXMax(e) {
		setMaxXThreshold(e.target.value);
	}

	function updateXMin(e) {
		setMinXThreshold(e.target.value);
	}

	useEffect(() => {

		newYRange.current.updateVal([minYThreshold, maxYThreshold]);
		let newAugs = newXRange.current.union(newYRange.current);

		chart.current.augment(newAugs);

	}, [minYThreshold, maxYThreshold])

	function updateYMax(e) {
		setMaxYThreshold(e.target.value);
	}

	function updateYMin(e) {
		setMinYThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>max x-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Aroma)}
					max={d3.max(data, d => d.Aroma)}
					step="0.01"
					value={maxXThreshold}
					onChange={(e) => updateXMax(e)} />
			</div>
			<div>
				<p>min x-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Aroma)}
					max={d3.max(data, d => d.Aroma)}
					step="0.01"
					value={minXThreshold}
					onChange={(e) => updateXMin(e)} />
			</div>
			<div>
				<p>max y-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Flavor)}
					max={d3.max(data, d => d.Flavor)}
					step="0.01"
					value={maxYThreshold}
					onChange={(e) => updateYMax(e)} />
			</div>
			<div>
				<p>min y-threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min={d3.min(data, d => d.Flavor)}
					max={d3.max(data, d => d.Flavor)}
					step="0.01"
					value={minYThreshold}
					onChange={(e) => updateYMin(e)} />
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
  name: 'Multi',
};