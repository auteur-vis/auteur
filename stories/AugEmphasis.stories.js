import React, {useRef, useState, useEffect} from "react";

import Chart from "../src/lib/Chart.js";
import Emphasis from "../src/lib/Emphasis.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Aug/Emphasis/Emphasis',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"mfr"};

export const ToStorybook = () => {

	const [xEmph, setXEmph] = React.useState(6);
	const [yEmph, setYEmph] = React.useState("R");

	let newXEmph = new Emphasis(cereal, "sugars", {"val":xEmph});
	let newYEmph = new Emphasis(cereal, "mfr", {"val":yEmph});

	let aug1 = newXEmph.getAugs();
	let aug2 = newYEmph.getAugs();

	const [augs, setAugs] = React.useState([...aug1, ...aug2]);

	useEffect(() => {

		let chart = new Chart("#e_svg", cereal, chartSpec, augs);
		chart.render();

	}, [augs])

	return (
		<div>
			<svg id="e_svg" />
			{/*<Chart data={cereal} chart={chartSpec} augmentations={augs} />*/}
		</div>
	)
}

ToStorybook.story = {
  name: 'Emphasis',
};