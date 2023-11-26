import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

import temperatures from "../../public/chartaccent_temperature.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'ChartAccent',
};

export const ToStorybook = () => {

	const [thresholds, setThresholds] = useState([]);

	const [data, setData] = useState(temperatures);
	const [xVar, setXVar] = useState("Seattle");
	const [yVar, setYVar] = useState("Caquetania");

	const ref = useRef("svg");

	const draft = useRef(new Draft());
	draft.current.chart(ref.current).exclude({"name":["fill"]})

	let layout={"width":700,
	   		   "height":450,
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

		function addThreshold(variable, val) {
			let newThreshold = new Threshold(variable, val);
			newThreshold.updateStyles({"text":{"text":val}});

			let newThresholds = thresholds.concat([newThreshold]);
			setThresholds(newThresholds);
		}


		let xScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d[xVar]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => d[yVar]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d[xVar]))
									.attr("cy", d => yScale(d[yVar]))
									.attr("r", 6)
									.attr("fill", "green")

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`)
				  .attr("cursor", "pointer")
				  .on("click", d => {
				  	addThreshold(xVar, Math.round(xScale.invert(d.offsetX)));
				  });

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data([xVar])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`)
				  .attr("cursor", "pointer")
				  .on("click", d => {
				  	addThreshold(yVar, Math.round(yScale.invert(d.offsetY)));
				  });

		svgElement.select("#yAxis").selectAll("#yTitle")
				  .data([yVar])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		draft.current.selection(scatterpoints)
					.x(xVar, xScale)
					.y(yVar, yScale);

	}, [data, xVar, yVar, thresholds])

	useEffect(() => {

		if (thresholds.length == 1) {
			draft.current.augment(thresholds[0].getAugs());
		} else if (thresholds.length > 1) {
			draft.current.augment(thresholds[0].union(thresholds.slice(1,)))
		}
		
	}, [thresholds])

	let backgroundStyle = {
		"width":"100vw",
		"height":"100vh",
		"padding":"10px",
		"background":"#F8F8F8",
		"display":"flex"}
	let svgStyle = {
		"width":layout.width,
		"height":layout.height,
		"background":"white",
		"border-radius":"10px"};
	let controlStyle = {
		"display":"flex",
		"flex-direction":"column",
		"margin-left": "10px",
		"width":"200px",
	}
	let annotationsStyle = {
		"background":"white",
		"width":"100%",
		"padding":"5px",
		"border-radius":"2px"
	}

	return (
		<div style={backgroundStyle}>
			<div>
				
			</div>
			<div style={svgStyle}>
				<svg id="less" ref={ref}>
					<g id="mark" />
					<g id="xAxis" />
					<g id="yAxis" />
					<text id="tooltip" />
				</svg>
			</div>
			<div style={controlStyle}>
				<p>Annotations</p>
				{thresholds.map(function(t) {
					return <div style={annotationsStyle} key={t._id}>{`${t._variable}: ${t._val}`}</div>
				})}
			</div>
		</div>
	)
}

ToStorybook.story = {
  name: 'ChartAccent',
};