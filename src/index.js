import React from "react";
import * as ReactDOMClient from 'react-dom/client';

// import Chart from "./lib/Chart.js";

// import cereal from "./shared/cereal.json"

const App = () => {

	// let chartSpec = {"mark":"point", "x":"sugars", "y":"calories"};

	return (

		<div>
			// <Chart data={cereal} chart={chartSpec} test="1" />
		</div>

	)

}

const container = document.getElementById('root');

const root = ReactDOMClient.createRoot(container);

root.render(<App />);