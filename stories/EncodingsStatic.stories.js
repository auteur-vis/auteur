import React from "react";

import { Chart } from "../src/lib/Chart.js";

import cereal from "../public/cereal.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Encodings/Static',
};

let chartSpec = {"mark":"point", "x":"rating", "y":"calories"};

// Change fill encoding
let aug1 = {"type": "encoding",
			"target": {"index":[0, 5, 10, 15, 20]},
			"style": {"fill":"red"}}

// Change stroke encoding
let aug2 = {"type": "encoding",
			"target": {"index":[1, 2, 3, 4]},
			"style": {"stroke":"orange", "stroke-width":2}}

// Change stroke encoding
let aug3 = {"type": "encoding",
			"target": {"index":[6, 7, 8, 9]},
			"style": {"r":5, "fill":"none", "stroke":"purple", "stroke-width":2}}

// Item based xy-value, no custom variable name provided, default chart xy-axis used, custom styles
let aug4 = {"type": "encoding",
			"target": {"index":["100% Natural Bran", "Post Nat. Raisin Bran"]},
			"style":{"stroke":"tomato", "stroke-width":2, "fill":"none"}}

// Item based xy-value, no custom variable name provided, default chart xy-axis used, custom styles
let aug5 = {"type": "encoding",
			"target": {"index":["Apple Cinnamon Cheerios", "Apple Jacks", "Corn Flakes", "Corn Chex", "Count Chocula"]},
			"style":{"stroke":"steelblue", "r":20, "stroke-width":2, "fill":"none", "stroke-dasharray":"2 3"}}


export const ToStorybook = () => (
	<div style={{"display":"flex"}}>
		<Chart data={cereal} chart={chartSpec} augmentations={[aug1, aug2, aug3]} />
		<Chart data={cereal} index="name" chart={chartSpec} augmentations={[aug4, aug5]} />
	</div>
  
)

ToStorybook.story = {
  name: 'Static',
};