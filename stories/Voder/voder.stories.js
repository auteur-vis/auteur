import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Emphasis from "../../src/lib/Emphasis.js";
import Regression from "../../src/lib/Regression.js";
import Threshold from "../../src/lib/Threshold.js";

import { getDataFacts } from './utils.js';

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import cars from "../../public/auto_mpg.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Voder',
};

export const ToStorybook = () => {

	const ref = useRef("voder");
	const chart = useRef(new Draft());

	const [data, setData] = React.useState(cars.map(d => {
		delete d["car name"];
		return d
	}));

	const variables = Object.keys(cars[0]);
	const [numericColumns, setNumericColumns] = useState(variables);

	const [x, setX] = useState(variables[0]);
	const [y, setY] = useState(variables[0]);

	const [dataFacts, setDataFacts] = useState([]);
	const [selectedDataFact, setSelectedDataFact] = useState("");
	const draft = useRef(new Draft());

	const marks = ["tick", "circle", "rect"];
	const [mark, setMark] = useState("circle");

	const dataTypes = {"mpg": "quantitative",
					    "cylinders": "ordinal",
					    "displacement": "quantitative",
					    "horsepower": "quantitative",
					    "weight": "quantitative",
					    "acceleration": "quantitative",
					    "model year": "ordinal",
					    "origin": "ordinal"}

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

		let xScale = d3.scaleLinear().range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear().range([layout.marginLeft, layout.width - layout.marginRight]);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data([x])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		svgElement.select("#yAxis").selectAll("#yTitle")
				  .data([y])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		let elements;

		if (mark === "tick") {

			let current = svgElement.select("#mark")
							.selectAll(".marks")

			current.remove();

			if (dataTypes[x] === "ordinal") {

				xScale = d3.scaleBand()
							.domain(Array.from(new Set(data.map(d => d[x]))).sort())
							.range([layout.marginLeft, layout.width - layout.marginRight]);
				yScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[y]))
						.range([layout.height - layout.marginBottom, layout.marginTop]);

				svgElement.select("#mark")
					.selectAll(".marks")
					.data(data)
					.join("line")
					.attr("class", "marks")
					.attr("x1", d => xScale(d[x]))
					.attr("y1", d => yScale(d[y]))
					.attr("x2", d => xScale(d[x]) + xScale.bandwidth())
					.attr("y2", d => yScale(d[y]))
					.attr("fill", "none")
					.attr("stroke", "steelblue");

				svgElement.select("#yAxis").selectAll("#yTitle")
				  .text(d => `${d}`);

				setDataFacts(getDataFacts(data, x, y, "tick", dataTypes));

				draft.current.x(x, xScale)
					 		 .y(y, yScale);

			} else if (dataTypes[y] === "ordinal") {

				xScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[x]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);
				yScale = d3.scaleBand()
						.domain(Array.from(new Set(data.map(d => d[y]))).sort())
						.range([layout.height - layout.marginBottom, layout.marginTop]);

				svgElement.select("#mark")
					.selectAll(".marks")
					.data(data)
					.join("line")
					.attr("class", "marks")
					.attr("y1", d => yScale(d[y]))
					.attr("x1", d => xScale(d[x]))
					.attr("y2", d => yScale(d[y]) + yScale.bandwidth())
					.attr("x2", d => xScale(d[x]))
					.attr("fill", "none")
					.attr("stroke", "steelblue");

				svgElement.select("#xAxis").selectAll("#xTitle")
				  .text(d => d);

				setDataFacts(getDataFacts(data, x, y, "tick", dataTypes));

				draft.current.x(x, xScale)
						 	 .y(y, yScale);

			}

		} else if (mark === "rect") {

			let current = svgElement.select("#mark")
							.selectAll(".marks")

			current.remove();

			if (dataTypes[x] === "ordinal") {

				let group = d3.group(data, d => d[x]);
				let groupedData = [...group.entries()].map(d => {
					let gd = {}; 
					gd[x] = d[0];
					gd.entries = d[1];
					gd.count = d[1].length;
					gd.avg = d3.mean(d[1], di => di[y]);
					return gd
				}).sort((a, b) => a[x] - b[x]);

				xScale = d3.scaleBand()
							.domain(Array.from(new Set(data.map(d => d[x]))).sort())
							.range([layout.marginLeft, layout.width - layout.marginRight]);
				yScale = d3.scaleLinear()
						.domain([0, d3.max(groupedData, d => d.avg)])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

				svgElement.select("#mark")
					.selectAll(".marks")
					.data(groupedData)
					.join("rect")
					.attr("class", "marks")
					.attr("x", d => xScale(d[x]) + 1)
					.attr("y", d => yScale(d.avg))
					.attr("width", d => xScale.bandwidth() - 2)
					.attr("height", d => yScale(0) - yScale(d.avg))
					.attr("fill", "steelblue");

				svgElement.select("#yAxis").selectAll("#yTitle")
				  .text(d => `${d} (average)`);

				setDataFacts(getDataFacts(groupedData, x, y, "rect", dataTypes));

				draft.current.x(x, xScale)
						 	 .y("avg", yScale);

			} else if (dataTypes[y] === "ordinal") {

				let group = d3.group(data, d => d[y]);
				let groupedData = [...group.entries()].map(d => {
					let gd = {};
					gd[y] = d[0];
					gd.entries = d[1];
					gd.count = d[1].length;
					gd.avg = d3.mean(d[1], di => di[y]);
					return gd
				}).sort((a, b) => a[y] - b[y]);

				yScale = d3.scaleBand()
							.domain(Array.from(new Set(data.map(d => d[y]))).sort())
							.range([layout.height - layout.marginBottom, layout.marginTop]);
				xScale = d3.scaleLinear()
						.domain([0, d3.max(groupedData, d => d.avg)])
						.range([layout.marginLeft, layout.width - layout.marginRight]);

				svgElement.select("#mark")
					.selectAll(".marks")
					.data(groupedData)
					.join("rect")
					.attr("class", "marks")
					.attr("y", d => yScale(d[y]) + 1)
					.attr("x", d => xScale(0))
					.attr("height", d => yScale.bandwidth() - 2)
					.attr("width", d => xScale(d.avg) - xScale(0))
					.attr("fill", "steelblue");

				svgElement.select("#xAxis").selectAll("#xTitle")
				  .text(d => `${d} (average)`);

				setDataFacts(getDataFacts(groupedData, x, y, "rect", dataTypes));

				draft.current.y(y, yScale)
						 	 .x("avg", xScale);

			}

		} else {

			xScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[x]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

			yScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[y]))
						.range([layout.height - layout.marginBottom, layout.marginTop]);

			let current = svgElement.select("#mark")
							.selectAll(".marks")

			current.remove();

			svgElement.select("#mark")
					.selectAll(".marks")
					.data(data)
					.join("circle")
					.attr("class", "marks")
					.attr("cx", d => xScale(d[x]) + Math.random() * 8 - 4)
					.attr("cy", d => yScale(d[y]) + Math.random() * 8 - 4)
					.attr("r", d => 3)
					.attr("fill", "none")
					.attr("stroke", "steelblue");

			svgElement.select("#xAxis").selectAll("#xTitle")
				  .text(d => d);

			svgElement.select("#yAxis").selectAll("#yTitle")
				  .text(d => d);

			setDataFacts(getDataFacts(data, x, y, "circle", dataTypes));

			draft.current.x(x, xScale)
						 .y(y, yScale);

		}

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#yAxis")
				  .call(d3.axisLeft(yScale))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		draft.current.chart(ref.current)
					 .select(".marks");

	}, [data, x, y, mark]) 

	// useEffect(() => {

	// 	let allGenerationCriteria = [];

	// 	draft.current.augment([]);

	// 	for (let df of dataFacts) {

	// 		if (df.generationCriteria === "emphasis") {

	// 			let newEmph = new Emphasis(df.variable, df.value);
	// 			newEmph.include({"name":["fill", "label", "stroke"]});
	// 			allGenerationCriteria.push(newEmph);

	// 		} else if (df.generationCriteria === "regression") {

	// 			let newRegression = new Regression();
	// 			newRegression.include({"name":["line"]});
	// 			allGenerationCriteria.push(newRegression);

	// 		} else if (df.generationCriteria === "threshold") {

	// 			for (let i = 0; i < df.variable.length; i++) {

	// 				let newThreshold = new Threshold(df.variable[i], df.value[i], df.type[i]);
	// 				newThreshold.include({"name":["fill", "label", "stroke"]});
	// 				allGenerationCriteria.push(newThreshold);

	// 			}

	// 		}

	// 	}

	// 	if (allGenerationCriteria.length === 0) {
	// 		draft.current.augment([]);
	// 	} else if (allGenerationCriteria.length === 1) {
	// 		// console.log("length 1", allGenerationCriteria);
	// 		draft.current.augment(allGenerationCriteria[0].getAugs());
	// 	} else {
	// 		// console.log("length > 1", allGenerationCriteria, allGenerationCriteria.slice(1,));
	// 		draft.current.augment(allGenerationCriteria[0].union(allGenerationCriteria.slice(1,)));
	// 	}

	// 	// chart.current.chart(ref.current)
	// 	// 			.selection(scatterpoints)
	// 	// 			.x(x, xScale)
	// 	// 			.y(y, yScale)
	// 	// 			.exclude()
	// 	// 			.augment(newXThreshold.current.union(newYThreshold.current));

	// }, [dataFacts])

	useEffect(() => {

		setSelectedDataFact("");

	}, [dataFacts])

	useEffect(() => {

		if (selectedDataFact != "") {

			draft.current.augment([]);

			let style = {"stroke":{"stroke-width":"3px", "stroke-color":"red"},
						 "fill":{"fill":"steelblue"}};

			let selected = dataFacts.filter(df => df.id === selectedDataFact)[0];

			if (selected.generationCriteria === "emphasis") {

				let newEmph = new Emphasis(selected.variable, selected.value);
				newEmph.include({"name":["fill", "stroke", "opacity"]});
				newEmph.updateStyles(style);
				draft.current.augment(newEmph.getAugs());

			} else if (selected.generationCriteria === "regression") {

				let newRegression = new Regression();
				newRegression.updateStyles(style);
				draft.current.augment(newRegression.getAugs());

			} else if (selected.generationCriteria === "threshold") {

				let allThresholds = [];

				for (let i = 0; i < selected.variable.length; i++) {

					let newThreshold = new Threshold(selected.variable[i], selected.value[i], selected.type[i]);
					newThreshold.include({"name":["fill", "stroke"]});	
					newThreshold.updateStyles(style);
					allThresholds.push(newThreshold);				

				}

				draft.current.augment(allThresholds[0].intersect(allThresholds[1]));

			}

		} else {

			draft.current.augment([]);

		}

	}, [selectedDataFact])

	function handleXFieldChange(e) {
		setX(e.target.value);
	}
	
	function handleYFieldChange(e) {
		setY(e.target.value);
	}

	function handleMarkChange(e) {
		setMark(e.target.value);
	}

	function handleSelect(e, df) {
		if (selectedDataFact === df.id) {
			setSelectedDataFact("");
		} else {
			setSelectedDataFact(df.id);
		}
	}

	let controlStyle = {"display":"flex",
						"fontFamily":"sans-serif",
						"fontSize":"12px",
						"marginRight":"20px",
						"marginBottom":"10px"};
	let paragraphStyle = {"margin":"3px"};
	let selectStyle = {"borderRadius":"20px",
					   "marginLeft":"5px"};
	let mainStyle = {"display":"flex"};
	let dfMainStyle = {"display":"flex",
				   "flexDirection":"column",
				   "fontFamily":"sans-serif",
				   "fontSize":"12px",
				   "marginLeft":"50px",
				   "marginTop": "10px"};
	let dfStyle = {"cursor":"pointer",
				   "border":"solid #e3e3e3",
				   "borderRadius":"3px",
				   "padding":"5px 15px",
				   "margin":"2px"};
	let dfStyleSelected = {"cursor":"pointer",
				   "border":"solid white",
				   "borderRadius":"3px",
				   "padding":"5px 15px",
				   "margin":"2px",
				   "background":"#f0f0f0"};

	return (
		<div>
            <div style={mainStyle}>
	            <div style={{"marginTop":layout.marginTop}}>
	                <div style={controlStyle}>
	                    <p style={paragraphStyle}>X: </p>
	                    <select style={selectStyle} value={x || ""} onChange={handleXFieldChange}>
	                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
	                    </select>
	                </div>
	                <div style={controlStyle}>
	                    <p style={paragraphStyle}>Y: </p>
	                    <select style={selectStyle} value={y || ""} onChange={handleYFieldChange}>
	                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
	                    </select>
	                </div>
	                <div style={controlStyle}>
	                    <p style={paragraphStyle}>Mark: </p>
	                    <select style={selectStyle} value={mark || ""} onChange={handleMarkChange}>
	                        {marks.map(col => <option key={col} value={col}>{col}</option>)}
	                    </select>
	                </div>
	            </div>
				<svg id="less" ref={ref}>
					<g id="mark" />
					<g id="xAxis" />
					<g id="yAxis" />
					<text id="tooltip" />
				</svg>
				<div style={dfMainStyle}>
					<h3>Data Facts</h3>
					{dataFacts.map((df, i) => { return <p key={i} style={df.id === selectedDataFact ? dfStyleSelected : dfStyle} onClick={(e) => handleSelect(e, df)}>{df.text}</p> }) }
				</div>
			</div>
		</div>
	)
}

ToStorybook.story = {
  name: 'Voder',
};