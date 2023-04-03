import React, {useRef, useState, useEffect} from "react";

import { Chart } from "../src/lib/Chart.js";
import ThresholdLess from "../src/lib/ThresholdLess.js";
import ThresholdGreater from "../src/lib/ThresholdGreater.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Threshold Range',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold1, setXThreshold1] = React.useState(3);
	const [xThreshold2, setXThreshold2] = React.useState(12);

	let newXThreshold1 = new ThresholdGreater(cereal, "sugars", xThreshold1);
	let newXThreshold2 = new ThresholdLess(cereal, "sugars", xThreshold2);

	let newAugs = newXThreshold1.intersect(newXThreshold2);

	const [augs, setAugs] = React.useState([...newAugs])

	useEffect(() => {

		newXThreshold1.updateVal(xThreshold1);
		let newAugs = newXThreshold1.intersect(newXThreshold2);

		setAugs([...newAugs]);

	}, [xThreshold1])

	function updateX1(e) {
		setXThreshold1(e.target.value);
	}

	useEffect(() => {

		newXThreshold2.updateVal(xThreshold2);
		let newAugs = newXThreshold2.intersect(newXThreshold1);

		setAugs([...newAugs]);

	}, [xThreshold2])

	function updateX2(e) {
		setXThreshold2(e.target.value);
	}

	return (
		<div>
			<div>
				<p>greater-than: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="0" max="15"
					value={xThreshold1}
					onChange={(e) => updateX1(e)} />
			</div>
			<div>
				<p>less than: </p>
				<input
					type="range"
					id="quantity"
					name="quantity"
					min="1" max="15"
					value={xThreshold2}
					onChange={(e) => updateX2(e)} />
			</div>
			<Chart data={cereal} chart={chartSpec} augmentations={augs} />
		</div>
	)
}

ToStorybook.story = {
  name: 'Threshold Range',
};