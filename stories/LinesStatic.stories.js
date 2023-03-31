import React from "react";

import { Chart } from "../src/lib/Chart.js";

import cereal from "../public/cereal.json";

// let unadjustedData = JSON.parse(JSON.stringify(CohortConfounds)).map((d, i) => {d.treatment = CohortTreatments[i]; d.propensity = CohortPropensity[i]; return d})

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Lines/Static',
};

let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

// Vertical threshold line, custom variable name
let aug1 = {"type": "line",
			"target": {"data":[{"x": 7}, {"x": 7}]},
			"encoding": {"x":"x"}}

// Horizontal threshold line, custom variable name
let aug2 = {"type": "line",
			"target": {"data":[{"y": 115}, {"y": 115}]},
			"encoding": {"y":"y"}}

// Horizontal threshold line, custom variable name, custom styles
let aug3 = {"type": "line",
			"target": {"data":[{"myCalories": 75}, {"myCalories": 75}]},
			"encoding": {"y":"myCalories"},
			"style":{"stroke":"red", "stroke-width":3}}

// Varying y-value, no custom variable name provided, default chart y-axis used, custom styles
let aug4 = {"type": "line",
			"target": {"data":[{"calories": 85}, {"calories": 105}]},
			"style":{"stroke":"blue", "stroke-dasharray":"5 5 10 5"}}

// Varying xy-value, custom variable name provided for x value, default chart y-axis used, custom styles
let aug5 = {"type": "line",
			"target": {"data":[{"mySugars": 1, "calories":80}, {"mySugars": 5, "calories":120}]},
			"encoding": {"x":"mySugars"},
			"style":{"stroke":"purple", "stroke-width":3, "stroke-dasharray":"10 7"}}

// Varying xy-value, no custom variable name provided, default chart xy-axis used, custom styles
let aug6 = {"type": "line",
			"target": {"data":[{"sugars": 6, "calories": 125}, {"sugars": 13, "calories":150}]},
			"style":{"stroke":"purple", "stroke-width":3, "stroke-dasharray":"10 7"}}

// Item based xy-value, no custom variable name provided, default chart xy-axis used, custom styles
let aug7 = {"type": "line",
			"target": {"index":["100% Natural Bran", "Post Nat. Raisin Bran"]},
			"style":{"stroke":"tomato", "stroke-width":3}}


export const ToStorybook = () => (
  <Chart data={cereal} index="name" chart={chartSpec} augmentations={[aug1, aug2, aug3, aug4, aug5, aug6, aug7]} />
)

ToStorybook.story = {
  name: 'Static',
};