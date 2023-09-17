import React, {useRef, useState, useEffect} from "react";
import * as d3 from "d3";

import Chart from "../src/lib/Chart.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Bar/Less',
};

export const ToStorybook = () => {

	let group = d3.group(cereal, d => d["mfr"]);
	let groupedData = [...group.entries()].map(d => { return {"mfr":d[0], "count":d[1].length} });
	let barSpec = {"mark":"bar", "x":{"variable":"mfr", "type":"categorical"}, "y":"count"};
	const [barThreshold, setBarThreshold] = React.useState(8.5);

	useEffect(() => {

		let newBarThreshold = new Threshold(groupedData, "count", barThreshold, "le");
		let augBar = newBarThreshold.getAugs();

		let chartbar = new Chart("#thres_bar", groupedData, barSpec, augBar);
		chartbar.render();

	}, [groupedData])

	function updateY(e) {
		setBarThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="1" max="23"
					value={barThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<svg id="thres_bar"></svg>
		</div>
	)
}

ToStorybook.story = {
  name: 'Less',
};