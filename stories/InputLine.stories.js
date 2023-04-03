import React, {useRef, useState, useEffect} from "react";

import { Chart } from "../src/lib/Chart.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Lines/Input Line',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

export const ToStorybook = () => {

	const [xThreshold, setXThreshold] = React.useState(7);

	// Vertical threshold line, custom variable name
	let aug1 = {"type": "line",
				"target": {"data":[{"x": xThreshold}, {"x": xThreshold}]},
				"encoding": {"x":"x"},
				"style":{"stroke":"red", "stroke-width":"3px"}};

	// Horizontal threshold line, custom variable name
	let aug2 = {"type": "line",
				"target": {"data":[{"y": 115}, {"y": 115}]},
				"encoding": {"y":"y"}};

	const [augs, setAugs] = React.useState([aug1, aug2])

	useEffect(() => {

		let newAug1 = {"type": "line",
				"target": {"data":[{"x": xThreshold}, {"x": xThreshold}]},
				"encoding": {"x":"x"},
				"style":{"stroke":"red", "stroke-width":"3px"}};

		setAugs([newAug1, aug2]);

	}, [xThreshold])

	function updateX(e) {
		setXThreshold(e.target.value);
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
			<Chart data={cereal} chart={chartSpec} augmentations={augs} />
		</div>
	)
}

ToStorybook.story = {
  name: 'Input Line',
};