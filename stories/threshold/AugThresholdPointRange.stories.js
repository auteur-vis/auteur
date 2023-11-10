import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Point/Range',
};

export const ToStorybook = () => {

	let countries = ["Colombia", "Guatemala", "Brazil", "Costa Rica", "Ethiopia"];
	let varieties = ["Other", "Arusha", "Bourbon", "Caturra", "Catuai"];

	let filteredCoffee = coffee.filter((d) => {return countries.indexOf(d.Country) >= 0 && varieties.indexOf(d.Variety) >= 0});

	let series = d3.stack()
					.keys(Array.from(new Set(filteredCoffee.map(d => d.Variety))))
					.value(([, D], key) => D.get(key) ? D.get(key).length : 0)(d3.group(filteredCoffee, d => d["Country"], d => d.Variety));
	let flatten = [];

	for (let t of series) {

		let variety = t.key;

		for (let m of t) {

			let country = m.data[0];

			flatten.push({"country":country, "variety":variety, "0":m[0], "1":m[1], "count":m[1] - m[0]});
		}

	}
	
	const [maxThreshold, setMaxThreshold] = React.useState(10);
	const [minThreshold, setMinThreshold] = React.useState(0);

	const ref = useRef("barstacked");
	const chart = useRef(new Draft());
	const newMaxThreshold = useRef(new Threshold("count", maxThreshold, "leq"));
	const newMinThreshold = useRef(new Threshold("count", minThreshold, "ge"));

	const [data, setData] = React.useState(flatten);

	let layout={"width":560,
	   		   "height":400,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":110};

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
						.domain(countries)
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleBand()
						.domain(data.map(d => d.variety).sort())
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d.count))
							.range([5, 20])

		let bars = svgElement.select("#mark")
							.selectAll(".point")
							.data(data)
							.join("circle")
							.attr("class", "point")
							.attr("cx", d => xScale(d.country) + xScale.bandwidth() / 2)
							.attr("cy", d => yScale(d.variety) + yScale.bandwidth() / 2)
							.attr("r", d => sizeScale(d.count))
							.attr("fill", "white")
							.attr("stroke", d => d.count != 0 ? "steelblue" : "none")
							.attr("stroke-width", 2)
							.on("mouseover", (event, d) => {

								let xPos = xScale(d.country) + xScale.bandwidth() / 2;
								let yPos = yScale(d.variety);

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

		const styles = {"stroke": {"stroke": "red", "stroke-width": "2px"}};

		newMaxThreshold.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(bars)
					.x("country", xScale)
					.y("variety", yScale)
					.include({"name":["stroke"]})
					.augment(newMaxThreshold.current.intersect(newMinThreshold.current));

	}, [data])

	useEffect(() => {

		newMaxThreshold.current.updateVal(maxThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [maxThreshold])

	useEffect(() => {

		newMinThreshold.current.updateVal(minThreshold);
		let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

		chart.current.augment(newAugs);

	}, [minThreshold])

	function updateMax(e) {
		setMaxThreshold(e.target.value);
	}

	function updateMin(e) {
		setMinThreshold(e.target.value);
	}

	let controlStyle = {"display":"flex"};
	let paragraphStyle = {"margin":"3px"};

	return (
		<div>
			<div style={controlStyle}>
				<p style={paragraphStyle}>highlighting groups with between </p>
				<input
					type="number"
					id="quantity"
					name="quantity"
					min="0" max="12"
					value={minThreshold}
					onChange={(e) => updateMin(e)} />
				<p style={paragraphStyle}>and</p>
				<input
					type="number"
					id="quantity"
					name="quantity"
					min="0" max="23"
					value={maxThreshold}
					onChange={(e) => updateMax(e)} />
				<p style={paragraphStyle}>coffees:</p>
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
  name: 'Range',
};