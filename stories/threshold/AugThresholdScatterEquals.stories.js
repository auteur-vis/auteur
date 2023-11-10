import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/Equals',
};

export const ToStorybook = () => {
	const [x, setX] = useState(null);
	const [y, setY] = useState(null);
	const [xmin, setXmin] = React.useState(null);
	const [xmax, setXmax] = React.useState(null);
	const [ymin, setYmin] = React.useState(null);
	const [ymax, setYmax] = React.useState(null);
	const [xThreshold, setXThreshold] = React.useState(10);
	const [yThreshold, setYThreshold] = React.useState(10);
	const [xOperation, setXOperation] = useState("eq");
	const [yOperation, setYOperation] = useState("eq");

	const ref = useRef("multi");
	const chart = useRef(new Draft());
	const newXThreshold = useRef(new Threshold(x, xThreshold, xOperation));
	const newYThreshold = useRef(new Threshold(y, yThreshold, yOperation));

	const [data, setData] = React.useState(coffee);
	const [numericColumns, setNumericColumns] = useState([]);
	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	function updatePlot(x,y) {
		//console.log("update plot")
		//console.log(x,y)
		const [newXmin, newXmax] = d3.extent(data, d => +d[x]);
		const [newYmin, newYmax] = d3.extent(data, d => +d[y]);
		setXmin(newXmin);
		setXmax(newXmax);
		setYmin(newYmin);
		setYmax(newYmax);
		//console.log(newXmin, newXmax, newYmin, newYmax)
		let currXthreshold = (newXmin + newXmax) / 2
		let currYthreshold = (newYmin + newYmax) / 2
		setXThreshold(currXthreshold);
		setYThreshold(currYthreshold);
		//console.log(currXthreshold, currYthreshold)
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
							.domain(d3.extent(data, d => +d[x]))
							.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
							.domain(d3.extent(data, d => +d[y]))
							.range([layout.height - layout.marginBottom, layout.marginTop]);

		let scatterpoints = svgElement.select("#mark")
									.selectAll(".scatterpoint")
									.data(data)
									.join("circle")
									.attr("class", "scatterpoint")
									.attr("cx", d => xScale(d[x]) + Math.random() * 8 - 4)
									.attr("cy", d => yScale(d[y]) + Math.random() * 8 - 4)
									.attr("r", d => 3)
									.on("mouseover", (event, d) => {

										let xPos = xScale(d[x]);
										let yPos = yScale(d[y]) - 8;

										tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
												.attr("opacity", 1)
												.text(d.name);

									})
									.on("mouseout", (event, d) => {

										tooltip.attr("opacity", 0);

									});

		svgElement.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
				  .data([x])
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
				  .data([y])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x(x, xScale)
					.y(y, yScale)
					.exclude()
					.augment(newXThreshold.current.union(newYThreshold.current));


	} 

	function updateDropdown() {
		//console.log("updateDropdow")
		if (data && data.length) {
			const sampleRow = data[0];
			const potentialNumericColumns = Object.keys(sampleRow).filter(key =>
				data.every(row => !isNaN(row[key]))
			);
			
			setNumericColumns(potentialNumericColumns);
			let localX = x;
			let localY = y;
	
			if (potentialNumericColumns.length > 0) {
				localX = potentialNumericColumns[0];
				setX(localX);
				
				if (potentialNumericColumns.length > 1) {
					localY = potentialNumericColumns[1];
					setY(localY);
				}
			}
			return [localX, localY];
		} else {
			return [null, null];
		}
	}
	useEffect(()=> {
		const [updatedX, updatedY] = updateDropdown();
		updatePlot(updatedX,updatedY)
	}, [data])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);
		let newAugs = newXThreshold.current.union(newYThreshold.current);

		chart.current.augment(newAugs);

	}, [yThreshold])

	useEffect(() => {

		newXThreshold.current.updateVal(xThreshold);
		let newAugs = newXThreshold.current.union(newYThreshold.current);

		chart.current.augment(newAugs);

	}, [xThreshold])

	useEffect(() => {

		newYThreshold.current.updateType(yOperation);
		let newAugs = newXThreshold.current.union(newYThreshold.current);

		chart.current.augment(newAugs);

	}, [yOperation])

	useEffect(() => {

		newXThreshold.current.updateType(xOperation);
		let newAugs = newXThreshold.current.union(newXThreshold.current);

		chart.current.augment(newAugs);

	}, [xOperation])

	useEffect(() => {
		newYThreshold.current.updateVariable(y);
		let newAugs = newXThreshold.current.union(newYThreshold.current);
		chart.current.augment(newAugs);
	}, [y])

	useEffect(() => {
		newXThreshold.current.updateVariable(x);
		let newAugs = newXThreshold.current.union(newXThreshold.current);
		chart.current.augment(newAugs);
	}, [x])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	function handleXFieldChange(e) {
		setX(e.target.value);
		updatePlot(e.target.value,y);
	}
	
	function handleYFieldChange(e) {
		setY(e.target.value);
		updatePlot(x,e.target.value);
	}
	const handleFileUpload = (event) => {
		const file = event.target.files[0];
	
		if (!file) return;
	
		// Check the file extension
		const ext = file.name.split(".").pop();
	
		if (ext === "csv") {
			// CSV parsing
			Papa.parse(file, {
				complete: (result) => {
					setData(result.data);
				},
				header: true
			});
		} else if (["xls", "xlsx"].includes(ext)) {
			// Excel parsing
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = e.target.result;
				const workbook = XLSX.read(data, { type: 'binary' });
				const wsname = workbook.SheetNames[0];
				const ws = workbook.Sheets[wsname];
				const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
				// Convert the parsed data to the JSON format
				const jsonData = convertToJSON(parsedData);
				setData(jsonData);
			};
			reader.readAsBinaryString(file);
		} else if (ext === "json") {
			// JSON parsing
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = e.target.result;
				
				// Log the data before parsing to debug the content
				
				try {
					const jsonData = JSON.parse(data);
					setData(jsonData);
				} catch (err) {
					// Catch and log the error for debugging
					console.error("Error parsing JSON:", err);
				}
			};
			reader.readAsText(file);
		}
	};
	
	// Conversion function for parsed Excel data to the JSON format
	function convertToJSON(parsedData) {
		// Get the headers
		const headers = parsedData[0];
	
		// Map each row to an object
		const jsonData = parsedData.slice(1).map(row => {
			let obj = {};
			row.forEach((value, index) => {
				obj[headers[index]] = value;
			});
			return obj;
		});
	
		return jsonData;
	}


	return (
		<div>
			<div>
				<input type="file" onChange={handleFileUpload} accept=".csv, .xls, .xlsx, .json" />
				<p style={{ fontSize: '0.9em', marginTop: '8px' }}>
					Please upload a file in one of the following formats: CSV, XLS, XLSX, or JSON.
				</p>
			</div>

            <div>
                <div style={{ display: 'inline-block', marginRight: '20px' }}>
                    <p>X-axis Field: </p>
                    <select value={x || ""} onChange={handleXFieldChange}>
                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
                <div style={{ display: 'inline-block' }}>
                    <p>Y-axis Field: </p>
                    <select value={y || ""} onChange={handleYFieldChange}>
                        {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                </div>
            </div>
			<div>
    <div style={{ display: 'inline-block', marginRight: '20px' }}>
        <p>x-axis threshold: </p>
        <input
	
            type="range"
            id="quantity"
            name="quantity"
            min={xmin} max={xmax}
            value={xThreshold}
			step="0.01"
            onChange={(e) => updateX(e)} />
        {/* Textfield to show the current value of the x-axis threshold */}
        <input
            type="number"
            id="quantity"
            name="quantity"
            value={xThreshold}
            onChange={(e) => updateX(e)}
            style={{ marginLeft: '10px', width: '60px' }}
        />
    </div>
    <div style={{ display: 'inline-block' }}>
        <p>y-axis threshold: </p>
        <input
            type="range"
            id="quantity"
            name="quantity"
            min={ymin} max={ymax}
            value={yThreshold}
			step="0.01"
            onChange={(e) => updateY(e)} />
        {/* Textfield to show the current value of the y-axis threshold */}
        <input
            type="number"
            id="quantity"
            name="quantity"
            value={yThreshold}
            onChange={(e) => updateY(e)}
            style={{ marginLeft: '10px', width: '60px' }}
        />
    </div>
</div>

		<div>
			<div style={{ display: 'inline-block', marginRight: '20px' }}>
				<p>x-axis operation: </p>
				<select value={xOperation} onChange={(e) => setXOperation(e.target.value)}>
					<option value="eq">Equals</option>
					<option value="le">Less Than</option>
					<option value="leq">Less Than or Equals To</option>
					<option value="ge">Greater Than</option>
					<option value="geq">Greater Than or Equals to</option>
				</select>
			</div>
			<div style={{ display: 'inline-block' }}>
				<p>y-axis operation: </p>
				<select value={yOperation} onChange={(e) => setYOperation(e.target.value)}>
					<option value="eq">Equals</option>
					<option value="le">Less Than</option>
					<option value="leq">Less Than or Equals To</option>
					<option value="ge">Greater Than</option>
					<option value="geq">Greater Than or Equals To</option>
				</select>
			</div>
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
  name: 'Equals',
};