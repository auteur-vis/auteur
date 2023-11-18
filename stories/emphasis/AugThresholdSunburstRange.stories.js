import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Sunburst/Range',
};

export const ToStorybook = () => {

	let countries = ["Colombia", "Guatemala", "Brazil", "Costa Rica", "Ethiopia"];
	let varieties = ["Other", "Arusha", "Bourbon", "Caturra", "Catuai"];

	// Filter for countries and varieties
	let filteredCoffee = coffee.filter((d) => {return countries.indexOf(d.Country) >= 0 && varieties.indexOf(d.Variety) >= 0});

	// Nest data
	let groupbyCountry = {};

	for (let d of filteredCoffee) {

		if (d.Country in groupbyCountry) {
			groupbyCountry[d.Country].push(d);
		} else {
			groupbyCountry[d.Country] = [d];
		}

	}

	let hierarchy = [];

	for (let c of Object.keys(groupbyCountry)) {

		let countryData = groupbyCountry[c];

		let groupbyVariety = {};

		for (let d of countryData) {

			if (d.Variety in groupbyVariety) {
				groupbyVariety[d.Variety].push(d);
			} else {
				groupbyVariety[d.Variety] = [d];
			}

		}

		let countryNested = [];

		for (let v of Object.keys(groupbyVariety)) {

			let newChild = {};
			newChild.name = v;
			newChild.value = groupbyVariety[v].length;

			countryNested.push(newChild);

		}

		let newCountry = {};
		newCountry.name = c;
		newCountry.children = countryNested;

		hierarchy.push(newCountry);

	}

	// Compute the layout.
	const hierarchyData = d3.hierarchy({"name":"root", "children":hierarchy})
							.sum(d => d.value)
							.sort((a, b) => b.value - a.value);
	const root = d3.partition()
					.size([2 * Math.PI, hierarchyData.height + 1])
					(hierarchyData);
	root.each(d => d.current = d);
	
	const [maxThreshold, setMaxThreshold] = React.useState(150);
	const [minThreshold, setMinThreshold] = React.useState(100);

	const ref = useRef("barstacked");
	const chart = useRef(new Draft());
	const newMaxThreshold = useRef(new Threshold("count", maxThreshold, "leq"));
	const newMinThreshold = useRef(new Threshold("count", minThreshold, "ge"));

	const [data, setData] = React.useState(root);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	useEffect(() => {

		let svgElement = d3.select(ref.current).attr("viewBox", [-layout.width / 2, -layout.height / 2, layout.width, layout.width]);

		let radius = (layout.width - layout.marginLeft - layout.marginRight) / 5;

		const colorScale = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

		function arcVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
		}

		function labelVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
		}

		function labelTransform(d) {
			const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
			const y = (d.y0 + d.y1) / 2 * radius;
			return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
		}

		const arc = d3.arc()
						.startAngle(d => d.x0)
						.endAngle(d => d.x1)
						.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
						.padRadius(radius * 1.5)
						.innerRadius(d => d.y0 * radius)
						.outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

		const path = svgElement.append("g")
						.selectAll("path")
						.data(root.descendants().slice(1))
						.join("path")
						.attr("fill", d => { while (d.depth > 1) d = d.parent; return colorScale(d.data.name); })
						.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
						.attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")

						.attr("d", d => arc(d.current));

		const format = d3.format(",d");
						path.append("title")
							.text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

		const label = svgElement.append("g")
						.attr("pointer-events", "none")
						.attr("text-anchor", "middle")
						.style("user-select", "none")
		.selectAll("text")
		.data(root.descendants().slice(1))
		.join("text")
			.attr("dy", "0.35em")
			.attr("fill-opacity", d => +labelVisible(d.current))
			.attr("transform", d => labelTransform(d.current))
			.attr("font-family", "sans-serif")
			.attr("font-size", "10")
			.text(d => d.data.name);

		console.log(path.data())

		const styles = {"stroke": {"stroke": "red", "stroke-width": "2px"}};

		newMaxThreshold.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(path)
					.include({"name":["opacity", "stroke"]})
					.augment(newMaxThreshold.current.intersect(newMinThreshold.current));

	}, [data])

	// useEffect(() => {

	// 	newMaxThreshold.current.updateVal(maxThreshold);
	// 	let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

	// 	chart.current.augment(newAugs);

	// }, [maxThreshold])

	// useEffect(() => {

	// 	newMinThreshold.current.updateVal(minThreshold);
	// 	let newAugs = newMaxThreshold.current.intersect(newMinThreshold.current);

	// 	chart.current.augment(newAugs);

	// }, [minThreshold])

	// function updateMax(e) {
	// 	setMaxThreshold(e.target.value);
	// }

	// function updateMin(e) {
	// 	setMinThreshold(e.target.value);
	// }

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