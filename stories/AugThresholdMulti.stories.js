import React, {useRef, useState, useEffect} from "react";

import { Chart } from "../src/lib/Chart.js";
import ThresholdLess from "../src/lib/ThresholdLess.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold Multi',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(7.5);
	const [yThreshold, setYThreshold] = React.useState(115);

	let newXThreshold = new ThresholdLess(cereal, "sugars", xThreshold);
	let newYThreshold = new ThresholdLess(cereal, "calories", yThreshold);

	let aug1 = newXThreshold.getAugs();
	let aug2 = newYThreshold.getAugs();

	for (let a1 of aug1) {
		if (a1.name.endsWith("color")) {
			a1.style = {"r":5, "stroke":"tomato", "stroke-width":2};
		}
	}

	for (let a2 of aug2) {
		if (a2.name.endsWith("color")) {
			a2.style = {"fill":"skyblue"};
		}
	}

	const [augs, setAugs] = React.useState([...aug1, ...aug2])

	useEffect(() => {

		newXThreshold.updateVal(xThreshold);

		let newAug1 = newXThreshold.getAugs();

		for (let a1 of newAug1) {
			if (a1.name.endsWith("color")) {
				a1.style = {"r":5, "stroke":"tomato", "stroke-width":2};
			}
		}

		setAugs([...newAug1, ...aug2]);

	}, [xThreshold])

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	useEffect(() => {

		newYThreshold.updateVal(yThreshold);

		let newAug2 = newYThreshold.getAugs();

		for (let a2 of newAug2) {
			if (a2.name.endsWith("color")) {
				a2.style = {"fill":"skyblue"};
			}
		}

		setAugs([...aug1, ...newAug2]);

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
			<Chart data={cereal} chart={chartSpec} augmentations={augs} />
		</div>
	)
}

ToStorybook.story = {
  name: 'Threshold Multi',
};