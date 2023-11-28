import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Regression from "../../src/lib/Regression.js";
import Emphasis from "../../src/lib/Emphasis.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data
import gender_gap from "../../public/reardon_gender_achievement_gaps_june2018.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/DataStorytelling/Gender_Achievement_Gap',
};

export const ToStorybook = () => {

	const ref = useRef("storytelling");

	const [emphVal, setEmphVal] = React.useState();
	const newEmphasis = useRef(new Emphasis("LEA Name", [emphVal]));
	newEmphasis.current.include({"name":["stroke"]});

	const include = gender_gap.filter(d => d["Reliable District Gap Estimate; District has >200 Male/Female Students per Grade"] == 1);
	const options = ["All"].concat(include.map(d => d["LEA Name"]).sort());

	const [data, setData] = React.useState(include.map(d => {
		d.Math = d["EB Male-Female Math Achievement Gap (Grade Equivalent Units)"];
		d.ELA = d["EB Male-Female ELA Achievement Gap (Grade Equivalent Units)"];
		d.parents = d["SES Composite - All Adults"];
		d.students = d["Average Number of Students in a Grade-Subject-Year"]

		return d
	}));

	const regression = useRef(new Regression());

	let layout={"width":800,
	   		   "height":600,
	   		   "marginTop":0,
	   		   "marginRight":10,
	   		   "marginBottom":10,
	   		   "marginLeft":10};

	const draft = useRef(new Draft());

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
					.domain(d3.extent(data, d => d["parents"]))
					.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
					.domain([0.8, -1.5])
					.range([layout.height - layout.marginBottom, layout.marginTop]);

		let sizeScale = d3.scaleLog()
					.domain(d3.extent(data, d => d["students"]))
					.range([1, 20]);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data(["richer parents →"])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "end")
				  .attr("transform", `translate(${layout.width - layout.marginRight}, ${layout.height - 50})`)
				  .attr("fill", "black")
				  .text(d => d);

		let math = svgElement.select("#mark")
							.selectAll(".math")
							.data(data)
							.join("circle")
							.attr("class", d => `math scatterpoint`)
							.attr("cx", d => xScale(d.parents))
							.attr("cy", d => yScale(d.Math))
							.attr("r", d => sizeScale(d.students))
							.attr("fill-opacity", 0.15)
							.attr('fill', "#012a70");

		let ela = svgElement.select("#mark")
							.selectAll(".ela")
							.data(data)
							.join("circle")
							.attr("class", d => `ela scatterpoint`)
							.attr("cx", d => xScale(d.parents))
							.attr("cy", d => yScale(d.ELA))
							.attr("r", d => sizeScale(d.students))
							.attr("fill-opacity", 0.15)
							.attr('fill', "orange");

		let midPoint = new Threshold("math", 0, "leq", {"text":{"text":"↓ Boys test better"}});
		let midPoint2 = new Threshold("math", 0, "geq", {"text":{"text":"↑ Girls test better"}});

		midPoint = midPoint.include({"name":["text", "line"]});
		midPoint2 = midPoint2.include({"name":["text", "line"]});

		draft.current.chart("#svg")
			.selection(d3.selectAll(".scatterpoint"))
			.x("parents", xScale)
			.y("math", yScale)
			.augment(midPoint.getAugs())
			.augment(midPoint2.getAugs());

		let grades = [-1, -0.5, 0.5];

		for (let g of grades) {

			let thresholdStyle = {"line":{"stroke-dasharray":"2px", "opacity":0.25},
								  "text":{"text":`${Math.abs(g)} grade levels`}}
			let threshold = new Threshold("math", g, "eq", thresholdStyle);
			threshold = threshold.include({"name":["text", "line"]});

			draft.current.augment(threshold.getAugs());

		}

		draft.current.augment(newEmphasis.current.getAugs());

	}, [data])

	useEffect(() => {

		if (emphVal === "All") {
			newEmphasis.current.updateVal([]);
			draft.current.augment(newEmphasis.current.getAugs());
		} else {
			let newEmphVal = [emphVal];
			newEmphasis.current.updateVal(newEmphVal);
			draft.current.augment(newEmphasis.current.getAugs());
		}

	}, [emphVal])

	function updateEmphVal(e) {
		setEmphVal(e.target.value);
	}

	let controlStyle = {"display":"flex", "marginBottom":"20px", "marginTop":"50px"};
	let paragraphStyle = {"margin":"3px", "fontFamily":"sans-serif"};

	return (
		<div>
			<p style={paragraphStyle}>This is an Auteur implementation of the New York Times article <a href='https://www.nytimes.com/interactive/2018/06/13/upshot/boys-girls-math-reading-tests.html'>"Where Boys Outperform Girls in Math:
Rich, White and Suburban Districts"</a>.</p>
			<p style={paragraphStyle}>Data obtained with thanks from the <a href='https://edopportunity.org/get-the-data/seda-archive-downloads/#ny-2-1'>Stanford Education Data Archive (Version 2.1)</a>.</p>
			<div style={controlStyle}>
				<p style={paragraphStyle}>Find a school district: </p>
				<select value={emphVal} onChange={(e) => updateEmphVal(e)}>
					{options.map((d, i) => {
						return <option value={d} key={`option1${i}`}>{d}</option>
					})}
				</select>
			</div>
			<h5 style={paragraphStyle}>The test score gender gap in about 1,800 large school districts:</h5>
			<svg id="svg" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<text id="tooltip" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Gender_Achievement_Gap',
};