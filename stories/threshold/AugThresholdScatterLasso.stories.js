import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draft from "../../src/lib/Draft.js";
import Threshold from "../../src/lib/Threshold.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Scatter/Lasso',
};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(7);

	const ref = useRef("less");

	const chart = useRef(new Draft());
	const newYThreshold = useRef(new Threshold("Flavor", 8, "geq"));
	const [selectedPoints, setSelectedPoints] = useState();

	// ... some code omitted ...

	const [data, setData] = useState(coffee);

	let layout={"width":500,
	   		   "height":500,
	   		   "marginTop":50,
	   		   "marginRight":50,
	   		   "marginBottom":50,
	   		   "marginLeft":50};

	// set up listeners that will follow this gesture all along
	// (even outside the target canvas)
	function trackPointer(e, { start, move, out, end }) {
	  const tracker = {},
	    id = (tracker.id = e.pointerId),
	    target = e.target;
	  tracker.point = d3.pointer(e, target);
	  target.setPointerCapture(id);

	  d3.select(target)
	    .on(`pointerup.${id} pointercancel.${id} lostpointercapture.${id}`, (e) => {
	      if (e.pointerId !== id) return;
	      tracker.sourceEvent = e;
	      d3.select(target).on(`.${id}`, null);
	      target.releasePointerCapture(id);
	      end && end(tracker);
	    })
	    .on(`pointermove.${id}`, (e) => {
	      if (e.pointerId !== id) return;
	      tracker.sourceEvent = e;
	      tracker.prev = tracker.point;
	      tracker.point = d3.pointer(e, target);
	      move && move(tracker);
	    })
	    .on(`pointerout.${id}`, (e) => {
	      if (e.pointerId !== id) return;
	      tracker.sourceEvent = e;
	      tracker.point = null;
	      out && out(tracker);
	    });

	  start && start(tracker);
	}

	useEffect(() => {

		let svgElement = d3.select(ref.current);
		let svg = svgElement.node()
		let path = d3.geoPath();
		let l = svgElement.append("path")
						  .attr("class", "lasso")
						  .attr("fill", "none")
						  .attr("stroke", "red")
						  .attr("stroke-width", "2px");

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
									.join("rect")
									.attr("class", "scatterpoint")
									.attr("x", d => xScale(d["Aroma"]) - 3)
									.attr("y", d => yScale(d["Flavor"]) - 3)
									.attr("width", 6)
									.attr("height", 6)
									.attr("opacity", 0.3)

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

		// Lasso adapted from https://observablehq.com/@fil/lasso-selection
		function lasso() {
			const dispatch = d3.dispatch("start", "lasso", "end");
			const lasso = function(selection) {
			const node = selection.node();
			const polygon = [];

			selection
			  .on("touchmove", e => e.preventDefault()) // prevent scrolling
			  .on("pointerdown", e => {
			    trackPointer(e, {
			      start: p => {
			        polygon.length = 0;
			        dispatch.call("start", node, polygon);
			      },
			      move: p => {
			        polygon.push(p.point);
			        dispatch.call("lasso", node, polygon);
			      },
			      end: p => {
			        dispatch.call("end", node, polygon);
			      }
			    });
			  });
			};
			lasso.on = function(type, _) {
			return _ ? (dispatch.on(...arguments), lasso) : dispatch.on(...arguments);
			};

			return lasso;
		}

		function draw(polygon) {
		    l.datum({
		      type: "LineString",
		      coordinates: polygon
		    }).attr("d", path);

		    const selected = polygon.length > 2 ? [] : data;

		    // note: d3.polygonContains uses the even-odd rule
		    // which is reflected in the CSS for the lasso shape
		    let isSelected = scatterpoints.filter(
		      (d) => {
		      	let coords = [xScale(d["Aroma"]), yScale(d["Flavor"])]
		      	return polygon.length > 2 && d3.polygonContains(polygon, coords)}
		    );

		    setSelectedPoints(isSelected);

		    svg.value = { polygon, selected };
		    svg.dispatchEvent(new CustomEvent('input'));
		}

		svgElement.call(lasso().on("start lasso end", draw));

		// ... some code omitted ...

		let colorScale = d3.scaleSequential(d3.interpolateMagma)
							.domain(d3.extent(data, d => d["Aroma"]));

		const styles = {"fill": {"fill": (d, i) => colorScale(d.Aroma)}};

		newYThreshold.current.updateStyles(styles);

		chart.current.chart(ref.current)
					.selection(scatterpoints)
					.x("Aroma", xScale)
					.y("Flavor", yScale)
					.exclude({"rank":4})
					.augment(newYThreshold.current.getAugs());

	}, [data])

	useEffect(() => {

		newYThreshold.current.selection(selectedPoints);
		let newAug2 = newYThreshold.current.getAugs();
		
		chart.current.augment(newAug2);

	}, [selectedPoints])

	useEffect(() => {

		newYThreshold.current.updateVal(yThreshold);
		let newAug2 = newYThreshold.current.getAugs();
		
		chart.current.augment(newAug2);

	}, [yThreshold])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="6" max="9"
					step="0.01"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
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
  name: 'Lasso',
};