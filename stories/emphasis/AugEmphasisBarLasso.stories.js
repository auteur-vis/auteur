import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Draught from "../../src/lib/Draught.js";
import Emphasis from "../../src/lib/Emphasis.js";

// data from https://rkabacoff.github.io/qacData/reference/coffee.html
import coffee from "../../public/arabica_data_cleaned_top15.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Bar/Lasso',
};

export const ToStorybook = () => {
	const style = {"fill":{"fill":"steelblue"},
				   "line":{"stroke-dasharray":"2px 5px 5px 5px"}};

	const ref = useRef("range");
	const chart = useRef(new Draught());
				
	const [data, setData] = React.useState(coffee.slice(0, 5));

	const [selectedBars, setSelectedBars] = useState();

	const newRange = useRef(new Emphasis(undefined, undefined, undefined, style));

	let layout={"width":900,
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

		let xScale = d3.scaleBand()
						.domain(data.map(d => d["FIELD1"]))
						.range([layout.marginLeft, layout.width - layout.marginRight]);

		let yScale = d3.scaleLinear()
						.domain([d3.min(data, d => d.Flavor) - 0.5, d3.max(data, d => d["Flavor"])])
						.range([layout.height - layout.marginBottom, layout.marginTop]);

		let bars = svgElement.select("#mark")
							.selectAll(".bar")
							.data(data)
							.join("rect")
							.attr("class", "bar")
							.attr("x", d => xScale(d["FIELD1"]) + 25)
							.attr("y", d => yScale(d["Flavor"]))
							.attr("width", xScale.bandwidth() - 50)
							.attr("height", d => layout.height - layout.marginBottom - yScale(d["Flavor"]))
							.attr("fill", "none")
							.attr("stroke", "black")
							.attr("opacity", "0.25")
							.on("mouseover", (event, d) => {

								let xPos = xScale(d["FIELD1"]) + xScale.bandwidth() / 2;
								let yPos = yScale(d["Flavor"]) - 8;

								tooltip.attr("transform", `translate(${xPos}, ${yPos})`)
										.attr("opacity", 1)
										.text(`${d.Flavor} Flavor`);

							})
							.on("mouseout", (event, d) => {

								tooltip.attr("opacity", 0);

							});

		chart.current.chart(ref.current)
					.selection(bars)
					.x("FIELD1", xScale)
					.y("Flavor", yScale)
					.exclude({"name":["text", "fill"]})
					.augment(newRange.current.getAugs());

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
		    let isSelected = bars.filter(
		      (d) => {
		      	let coords = [xScale(d["FIELD1"]) + xScale.bandwidth() / 2, yScale(d["Flavor"])]
		      	return polygon.length > 2 && d3.polygonContains(polygon, coords)}
		    );

		    setSelectedBars(isSelected);

		    svg.value = { polygon, selected };
		    svg.dispatchEvent(new CustomEvent('input'));
		}

		svgElement.call(lasso().on("start lasso end", draw));

		svgElement.select("#xAxis")
					.call(d3.axisBottom(xScale))
					.attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#yAxis")
					.call(d3.axisLeft(yScale).ticks(5))
					.attr("transform", `translate(${layout.marginLeft}, 0)`);

		let xAxis = svgElement.select("#xAxis")
					.call(d3.axisBottom(xScale))
					.attr("transform", `translate(0, ${layout.height - layout.marginBottom})`);

		svgElement.select("#xAxis").selectAll("#xTitle")
					.data(["FIELD1 (ID)"])
					.join("text")
					.attr("id", "xTitle")
					.attr("text-anchor", "middle")
					.attr("transform", `translate(${layout.width/2}, 30)`)
					.attr("fill", "black")
					.text(d => d);

		let yAxis = svgElement.select("#yAxis")
					.call(d3.axisLeft(yScale).ticks(5))
					.attr("transform", `translate(${layout.marginLeft}, 0)`);

		svgElement.select("#yAxis").selectAll("#yTitle")
					.data(["Flavor"])
					.join("text")
					.attr("id", "yTitle")
					.attr("text-anchor", "middle")
					.attr("transform", `translate(0, 40)`)
					.attr("fill", "black")
					.text(d => d);
	}, [data])

	useEffect(() => {

		newRange.current.selection(selectedBars);
		let newAugs = newRange.current.getAugs();
		chart.current.augment(newAugs);

	}, [selectedBars])

	return (
		<div>
			<svg id="less" ref={ref}>
				<g id="mark" />
				<g id="xAxis" />
				<g id="yAxis" />
				<text id="tooltip" />
				<g id="augmentations" />
			</svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Lasso',
};