import React, {useRef, useState, useEffect} from "react";

import Chart from "../src/lib/Chart.js";
import Threshold from "../src/lib/Threshold.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold/Equals',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(7.5);
	const [yThreshold, setYThreshold] = React.useState(115);

	let newXThreshold = new Threshold(cereal, "sugars", xThreshold);
	let newYThreshold = new Threshold(cereal, "calories", yThreshold);

	let aug1 = newXThreshold.getAugs();
	let aug2 = newYThreshold.getAugs();

	const [augs, setAugs] = React.useState([...aug1, ...aug2]);

	useEffect(() => {

		newXThreshold.updateVal(xThreshold);

		let newAug1 = newXThreshold.getAugs();

		let allAugs = [...newAug1, ...aug2];

		let chart = new Chart("#thres_eq", cereal, chartSpec, allAugs);
		chart.render();

	}, [xThreshold])

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	useEffect(() => {

		newYThreshold.updateVal(yThreshold);

		let newAug2 = newYThreshold.getAugs();

		setAugs([...aug1, ...newAug2]);

		let allAugs = [...aug1, ...newAug2];

		let chart = new Chart("#thres_eq", cereal, chartSpec, allAugs);
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
					type="number"
					id="quantity"
					name="quantity"
					min="1" max="15"
					value={xThreshold}
					onChange={(e) => updateX(e)} />
			</div>
			<div>
				<p>y-axis threshold: </p>
				<input
					type="number"
					id="quantity"
					name="quantity"
					min="60" max="160"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<svg id="thres_eq" />
		</div>
	)
}

ToStorybook.story = {
  name: 'Equals',
};