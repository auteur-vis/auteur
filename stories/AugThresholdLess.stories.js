import React, {useRef, useState, useEffect} from "react";

import { Chart } from "../src/lib/Chart.js";
import ThresholdLess from "../src/lib/ThresholdLess.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold Less',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [yThreshold, setYThreshold] = React.useState(115);

	let newYThreshold = new ThresholdLess(cereal, "calories", yThreshold);

	let aug2 = newYThreshold.getAugs();

	const [augs, setAugs] = React.useState([...aug2])

	useEffect(() => {

		newYThreshold.updateVal(yThreshold);

		let newAug2 = newYThreshold.getAugs();

		setAugs([...newAug2]);

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
					min="60" max="160"
					value={yThreshold}
					onChange={(e) => updateY(e)} />
			</div>
			<Chart data={cereal} chart={chartSpec} augmentations={augs} />
		</div>
	)
}

ToStorybook.story = {
  name: 'Threshold Less',
};