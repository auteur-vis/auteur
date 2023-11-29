import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/BasicD3',
};

export const ToStorybook = () => {

	const ref = useRef("less");

	// ... some code omitted ...

	const [data, setData] = React.useState(coffee.slice(0, 20));

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	// Following function from https://dracoblue.net/dev/linear-least-squares-in-javascript/
	function findLineByLeastSquares(values_x, values_y) {
	    var sum_x = 0;
	    var sum_y = 0;
	    var sum_xy = 0;
	    var sum_xx = 0;
	    var count = 0;

	    /*
	     * We'll use those variables for faster read/write access.
	     */
	    var x = 0;
	    var y = 0;
	    var values_length = values_x.length;

	    if (values_length != values_y.length) {
	        throw new Error('The parameters values_x and values_y need to have same size!');
	    }

	    /*
	     * Nothing to do.
	     */
	    if (values_length === 0) {
	        return [ [], [] ];
	    }

	    /*
	     * Calculate the sum for each of the parts necessary.
	     */
	    for (var v = 0; v < values_length; v++) {
	        x = values_x[v];
	        y = values_y[v];
	        sum_x += x;
	        sum_y += y;
	        sum_xx += x*x;
	        sum_xy += x*y;
	        count++;
	    }

	    /*
	     * Calculate m and b for the formula:
	     * y = x * m + b
	     */
	    var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
	    var b = (sum_y/count) - (m*sum_x)/count;
    
	    let [x1, x2] = d3.extent(values_x);
	    let [y1, y2] = [x1 * m + b, x2 * m + b];

	    return [{"x1":x1, "y1":y1, "x2":x2, "y2":y2}]
	}

	useEffect(() => {

		let svg = d3.select(ref.current);

		// create a tooltip
		var tooltip = svg.select("#tooltip")
						.attr("text-anchor", "middle")
						.attr("font-family", "sans-serif")
						.attr("font-size", 10)
					    .attr("opacity", 0);

		svg.attr("width", layout.width)
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

		let thresholdValue = d3.median(data, d => d.Flavor);

		let scatterpoints = svg.select("#mark")
								.selectAll("circle")
								.data(data)
								.join("circle")
								.attr("cx", d => xScale(d["Aroma"]))
								.attr("cy", d => yScale(d["Flavor"]))
								.attr("r", 3)
								.attr("opacity", d => d.Flavor >= thresholdValue ? 1 : 0.25)
								.attr("fill", d => d.Flavor >= thresholdValue ? "red" : "steelblue")
								.attr("stroke", d => d.Flavor >= thresholdValue ? "black" : "none");

		let thresholdLine = svg.select("#mark")
								.selectAll("line")
								.data([thresholdValue])
								.join("line")
								.attr("x1", xScale.range()[0])
								.attr("y1", yScale(thresholdValue))
								.attr("x2", xScale.range()[1])
								.attr("y2", yScale(thresholdValue))
								.attr("stroke", "black");

		let thresholdText = svg.select("#mark")
								.selectAll("text")
								.data([thresholdValue])
								.join("text")
								.attr("x", xScale.range()[0] + 5)
								.attr("y", yScale(thresholdValue) - 10)
								.attr("alignment-baseline", "middle")
								.attr("text-anchor", "start")
								.attr("font-family", "sans-serif")
								.attr("font-size", 11)
								.text(d => `>= ${d} (median)`);

		let filteredData = data.filter(d => d.Flavor >= thresholdValue);

		let regressionCoords = findLineByLeastSquares(
			filteredData.map(d => d.Aroma),
			filteredData.map(d => d.Flavor));

		let regressionLine = svg.select("#mark")
								.selectAll("#regression")
								.data(regressionCoords)
								.join("line")
								.attr("id", "regression")
								.attr("x1", d => xScale(d.x1))
								.attr("y1", d => yScale(d.y1))
								.attr("x2", d => xScale(d.x2))
								.attr("y2", d => yScale(d.y2))
								.attr("stroke", "black");

		let thresholdLabels = svg.select("#mark")
								.selectAll(".labels")
								.data(filteredData)
								.join("text")
								.attr("id", "labels")
								.attr("x", d => xScale(d.Aroma))
								.attr("y", d => yScale(d.Flavor) - 15)
								.attr("alignment-baseline", "middle")
								.attr("text-anchor", "middle")
								.attr("font-family", "sans-serif")
								.attr("font-size", 11)
								.text(d => `${d.Flavor}`);

		svg.select("#xAxis")
				  .call(d3.axisBottom(xScale))
				  .attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svg.select("#xAxis").selectAll("#xTitle")
				  .data(["Aroma"])
				  .join("text")
				  .attr("id", "xTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(${layout.width/2}, 30)`)
				  .attr("fill", "black")
				  .text(d => d);

		svg.select("#yAxis")
				  .call(d3.axisLeft(yScale).ticks(5))
				  .attr("transform", `translate(${layout.marginLeft}, 0)`);

		svg.select("#yAxis").selectAll("#yTitle")
				  .data(["Flavor"])
				  .join("text")
				  .attr("id", "yTitle")
				  .attr("text-anchor", "middle")
				  .attr("transform", `translate(0, 40)`)
				  .attr("fill", "black")
				  .text(d => d)

	}, [data])

	return (
		<div>
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
  name: 'BasicD3',
};