import React, {useRef, useState, useEffect} from "react";

import { Chart } from "../src/lib/Chart.js";
import ThresholdLess from "../src/lib/ThresholdLess.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold Intersect',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(7.5);
	const [yThreshold, setYThreshold] = React.useState(115);

	let newXThreshold = new ThresholdLess(cereal, "sugars", xThreshold);
	let newYThreshold = new ThresholdLess(cereal, "calories", yThreshold);

	let newAugs = newXThreshold.intersect(newYThreshold);

	const [augs, setAugs] = React.useState([...newAugs]);

	useEffect(() => {

		newXThreshold.updateVal(xThreshold);
		let newAugs = newXThreshold.intersect(newYThreshold);

		setAugs([...newAugs]);

	}, [xThreshold])

	function updateX(e) {
		setXThreshold(e.target.value);
	}

	useEffect(() => {

		newYThreshold.updateVal(yThreshold);
		let newAugs = newXThreshold.intersect(newYThreshold);

		setAugs([...newAugs]);

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
  name: 'Threshold Intersect',
};