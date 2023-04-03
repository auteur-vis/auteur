import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

// index column values must be unique per data row, if no col name provided, defaults to index

export const Chart = ({data=[],
					   index="default",
					   layout={"width":500,
					   		   "height":500,
					   		   "marginTop":50,
					   		   "marginRight":50,
					   		   "marginBottom":50,
					   		   "marginLeft":50},
					   chart={"mark":"point",
							  "x":"none",
							  "y":"none"},
					   augmentations=[]
					   }) => {

	const ref = useRef("chart");

	const _defaultStyles = {"line": {"stroke":"black",
								     "stroke-width":1,
								     "stroke-dasharray":"none"},
							"point":{"fill":"black",
									 "r":3,
									 "stroke":"none"}
							}

	// This function computes coords of line-mark augmentations
	function getLineCoords(aug) {

		let lineCoords = {};

		let target;

		if (aug.target.data) {
			target = aug.target.data;
		} else if (aug.target.index) {
			target = index === "default" ? [data[aug.target.index[0]], data[aug.target.index[1]]] : [data.find(el => el[index] === aug.target.index[0]), data.find(el => el[index] === aug.target.index[1])]
		}

		// The following checks that the line specs are valid
		if (target.length != 2) {
			console.warn("expected only [start coords, end coords], more than 2 coords provided.");
			return null
		} else if (Object.keys(target[0]).length != Object.keys(target[1]).length || Object.keys(target[0]).length <= 0) {
			console.warn("start and end coords have unequal vars or no vars provided.");
			return null
		} // else if ( Object.keys(target[0]).sort().join(",") !=  Object.keys(target[1]).sort().join(",")) {

		// 	console.log("start and end coords have different vars.");
		// 	return null

		// }

		
		if (!aug.encoding) {

			// If no encodings provided, else use chart x and y

			lineCoords.x1 = target[0][chart.x] ? target[0][chart.x] : null;
			lineCoords.x2 = target[1][chart.x] ? target[1][chart.x] : null;
			lineCoords.y1 = target[0][chart.y] ? target[0][chart.y] : null;
			lineCoords.y2 = target[1][chart.y] ? target[1][chart.y] : null;

		} else {

			// If some encodings provided use encodings, else use chart x and y

			if (aug.encoding.x) {

				lineCoords.x1 = target[0][aug.encoding.x] ? target[0][aug.encoding.x] : null;
				lineCoords.x2 = target[1][aug.encoding.x] ? target[1][aug.encoding.x] : null;

			} else {

				lineCoords.x1 = target[0][chart.x] ? target[0][chart.x] : null;
				lineCoords.x2 = target[1][chart.x] ? target[1][chart.x] : null;

			}

			if (aug.encoding.y) {

				lineCoords.y1 = target[0][aug.encoding.y] ? target[0][aug.encoding.y] : null;
				lineCoords.y2 = target[1][aug.encoding.y] ? target[1][aug.encoding.y] : null;

			} else {

				lineCoords.y1 = target[0][chart.y] ? target[0][chart.y] : null;
				lineCoords.y2 = target[1][chart.y] ? target[1][chart.y] : null;

			}

		}

		if (!lineCoords.x1 && !lineCoords.x2 && !lineCoords.y1 && !lineCoords.y2) {
			console.warn("no coords could be computed");
			return null
		}

		return lineCoords;

	}

	// Handle augmentations for point charts
	function handlePointAugs(augmentations, svgElement, xScale, yScale, xMin, xMax, yMin, yMax) {

		let allPoints = svgElement.select("#mark")
								  .selectAll(".scatterpoint")

		for (let [key, val] of Object.entries(_defaultStyles["point"])) {
			allPoints.attr(key, val);
		}

		for (let i = 0; i < augmentations.length; i++) {
			let aug = augmentations[i];

			if (aug.type === "line") {

				let lineCoords = getLineCoords(aug);
				let augStyle = (aug.style && Object.keys(aug.style).length > 0) ? aug.style : _defaultStyles["line"]

				let newLine = svgElement.select("#augmentation")
					.selectAll(`.threshold${i}`)
					.data([lineCoords])
					.join("line")
					.attr("class", `threshold${i}`)
					.attr("x1", d => d.x1 ? xScale(d.x1) : xMin)
					.attr("x2", d => d.x2 ? xScale(d.x2) : xMax)
					.attr("y1", d => d.y1 ? yScale(d.y1) : yMin)
					.attr("y2", d => d.y2 ? yScale(d.y2) : yMax)

				for (let [key, val] of Object.entries(augStyle)) {
					newLine.attr(key, val);
				}

			} if (aug.type === "encoding") {

				if (!aug.style) {
					console.warn("encoding type augmentations require specified style");
				} else if (!aug.target.index) {
					console.warn("encoding type augmentations require an index array of elements to modify");
				} else {

					let augStyle = aug.style;
					let augIndex = aug.target.index;
					let augPoints = svgElement.select("#mark")
											  .selectAll(".scatterpoint")
											  .filter(function (d, i) {
											  	if (index === "default") {
											  		return augIndex.includes(i)
											  	} else {
											  		return augIndex.includes(d[index])
											  	}
											  })

					for (let [key, val] of Object.entries(augStyle)) {
						augPoints.attr(key, val);
					}

				}

			}

		}

	}

	useEffect(() => {

		let svgElement = d3.select(ref.current);

		// let svgElement = svg.select("g");

		let xScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[chart.x]))
						.range([layout.marginLeft, layout.width - layout.marginRight])

		let yScale = d3.scaleLinear()
						.domain(d3.extent(data, d => d[chart.y]))
						.range([layout.height - layout.marginBottom, layout.marginTop])

		let xAxis = svgElement.select("#xAxis")
							  .attr('transform', `translate(0, ${layout.height - layout.marginBottom})`)
							  .call(d3.axisBottom(xScale).tickSize(3).ticks(5))

		let yAxis = svgElement.select("#yAxis")
							  .attr('transform', `translate(${layout.marginLeft}, 0)`)
							  .call(d3.axisLeft(yScale).tickSize(3).ticks(5))

		if (chart["mark"] === "point") {

			let scatterpoints = svgElement.select("#mark")
				.selectAll(".scatterpoint")
				.data(data)
				.join("circle")
				.attr("class", "scatterpoint")
				.attr("cx", d => xScale(d[chart["x"]]))
				.attr("cy", d => yScale(d[chart["y"]]))
				.attr("r", 3)

			handlePointAugs(augmentations, svgElement, xScale, yScale, layout.marginLeft, layout.width - layout.marginRight, layout.height - layout.marginBottom, layout.marginTop);

		} else if (chart.mark === "bar") {

		} else if (chart.mark === "line") {

		} else {
			console.error("mark type not supported. please use point, bar or line.")
		}

	}, [data, augmentations])

	return (
		<div>
			<svg width={layout.width} height={layout.height} ref={ref}>
				<g id="mark" />
				<g id="augmentation" />
				<g id="xAxis" />
				<g id="yAxis" />
			</svg>
		</div>
	)
}
