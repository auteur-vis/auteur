import React, {useRef, useState, useEffect} from "react";

import Chart from "../src/lib/Chart.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Intersect',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(7.5);
	const [yThreshold, setYThreshold] = React.useState(115);

	let newXThreshold = new Threshold(cereal, "sugars", xThreshold, "le");
	let newYThreshold = new Threshold(cereal, "calories", yThreshold, "le");

	let newAugs = newXThreshold.intersect(newYThreshold);

	const [augs, setAugs] = React.useState([...newAugs]);

	useEffect(() => {

		newXThreshold.updateVal(xThreshold);
		let newAugs = newXThreshold.intersect(newYThreshold);

		let chart = new Chart("#thres_intersect", cereal, chartSpec, newAugs);
		chart.render();

	}, [xThreshold])

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	useEffect(() => {

		newYThreshold.updateVal(yThreshold);
		let newAugs = newXThreshold.intersect(newYThreshold);

		let chart = new Chart("#thres_intersect", cereal, chartSpec, newAugs);
		chart.render();

	}, [yThreshold])

	function updateY(e) {
		setYThreshold(e.target.value);
	}

	return (
		<div>
			<div>
				<p>x-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="1" max="15"
					value={xThreshold}
					onChange={(e) => updateX(e)} />
			</div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="60" max="160"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<svg id="thres_intersect" />
		</div>
	)
}

ToStorybook.story = {
  name: 'Intersect',
};