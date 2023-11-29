import { v4 as uuidv4 } from 'uuid';

// Adapted from https://stackoverflow.com/questions/15886527/javascript-library-for-pearson-and-or-spearman-correlations
function getPearsonCorrelation(x, y) {
	
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  const minLength = x.length = y.length = Math.min(x.length, y.length),
    reduce = (xi, idx) => {
      const yi = y[idx];
      sumX += xi;
      sumY += yi;
      sumXY += xi * yi;
      sumX2 += xi * xi;
      sumY2 += yi * yi;
    }
  x.forEach(reduce);
  return (minLength * sumXY - sumX * sumY) / Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));

}

function pairWiseCompare(data, ordinal, quant) {

	let maxPair = [];
	let maxDifference = 0;

	for (let i of data) {
		for (let j of data) {

			let difference = i.avg / j.avg;

			if (difference >= 1.5 && difference > maxDifference) {
				let newPair = {"text": `${ordinal} ${i[ordinal]} has average ${quant} ${Math.round(difference * 100) / 100} times ${ordinal} ${j[ordinal]}.`,
							   "generationCriteria":"emphasis",
							   "variable":ordinal,
							   "value":[i[ordinal], j[ordinal]]};

				maxPair = [newPair];
				maxDifference = difference;
			}

		}
	}

	return maxPair;

}

export function getDataFacts(data, x, y, mark, dataTypes) {

	let xType = dataTypes[x];
	let yType = dataTypes[y];

	let xVals = data.map(d => d[x]);
	let yVals = data.map(d => d[y]);

	let allDataFacts = [];

	if (xType === "ordinal") {

		if (mark === "rect") {

			let sortData = data.sort((a, b) => a.avg - b.avg);

			let minDataFact = {"text": `${x} ${sortData[0][x]} has the lowest average ${y}.`,
							   "generationCriteria":"emphasis",
							   "variable":"avg",
							   "value":"min",
							   "id":`${uuidv4()}`};
			let maxDataFact = {"text": `${x} ${sortData[sortData.length - 1][x]} has the lowest average ${y}.`,
							   "generationCriteria":"emphasis",
							   "variable":"avg",
							   "value":"max",
							   "id":`${uuidv4()}`};

			allDataFacts.push(minDataFact);
			allDataFacts.push(maxDataFact);

			allDataFacts = allDataFacts.concat(pairWiseCompare(data, x, y));
			
		} else {

			let sortData = data.sort((a, b) => a[y] - b[y]);

			let minDataFact = {"text": `${x} ${sortData[0][x]} has item with lowest value for ${y}.`,
							   "generationCriteria":"emphasis",
							   "variable":y,
							   "value":"min",
							   "id":`${uuidv4()}`};
			let maxDataFact = {"text": `${x} ${sortData[sortData.length - 1][x]} has item with highest value for ${y}.`,
							   "generationCriteria":"emphasis",
							   "variable":y,
							   "value":"max",
							   "id":`${uuidv4()}`};

			allDataFacts.push(minDataFact);
			allDataFacts.push(maxDataFact);

		}

	} else if (yType === "ordinal") {

		if (mark === "rect") {

			let sortData = data.sort((a, b) => a.avg - b.avg);

			let minDataFact = {"text": `${y} ${sortData[0][y]} has the lowest average ${x}.`,
							   "generationCriteria":"emphasis",
							   "variable":"avg",
							   "value":"min",
							   "id":`${uuidv4()}`};
			let maxDataFact = {"text": `${y} ${sortData[sortData.length - 1][y]} has the highest average ${x}.`,
							   "generationCriteria":"emphasis",
							   "variable":"avg",
							   "value":"max",
							   "id":`${uuidv4()}`};

			allDataFacts.push(minDataFact);
			allDataFacts.push(maxDataFact);

			allDataFacts = allDataFacts.concat(pairWiseCompare(data, y, x));
			
		} else {

			let sortData = data.sort((a, b) => a[y] - b[y]);

			let minDataFact = {"text": `${y} ${sortData[0][y]} has item with lowest value for ${x}.`,
							   "generationCriteria":"emphasis",
							   "variable":x,
							   "value":"min",
							   "id":`${uuidv4()}`};
			let maxDataFact = {"text": `${y} ${sortData[sortData.length - 1][y]} has item with highest value for ${x}.`,
							   "generationCriteria":"emphasis",
							   "variable":x,
							   "value":"max",
							   "id":`${uuidv4()}`};

			allDataFacts.push(minDataFact);
			allDataFacts.push(maxDataFact);

		}

	} else {

		let correlation = getPearsonCorrelation(xVals, yVals);

		if (correlation > 0.5 || correlation < 0.5) {

			let newDataFact = {"text": `${x} and ${y} have a strong ${correlation > 0.5 ? "positive" : "inverse"} correlation.`,
							   "generationCriteria":"regression",
							   "id":`${uuidv4()}`};

			allDataFacts.push(newDataFact);

		}

		let xMean = data.reduce((a, b) => a[x] + b[x]) / data.length;
		let groupByX = [data.filter(d => d[x] < xMean), data.filter(d => d[x] >= xMean)];

		let yMean = data.reduce((a, b) => a[y] + b[y]) / data.length;
		let groupByY = [];

		for (let xGroup of groupByX) {
			groupByY.concat([xGroup.filter(d => d[y] < yMean), xGroup.filter(d => d[y] >= yMean)]);
		}

		let majority = Math.round(data.length * 0.75);

		for (let g = 0; g < groupByY.length; g++) {

			let group = groupByY[g];
			if (group.length > majority) {

				let newDataFact = {"text": `Most items in the dataset have ${g < 2 ? "low" : "high"} ${x} and ${(g === 1 || g === 3) ? "low" : "high"} ${y}.`,
							   	   "generationCriteria":"threshold",
							   	   "variable":[x, y],
							   	   "values":[xMean, yMean],
							   	   "types":[g < 2 ? "le" : "geq", (g === 1 || g === 3) ? "le" : "geq"],
							   	   "id":`${uuidv4()}`};

				allDataFacts.push(newDataFact);

			}

		}

	}

	return allDataFacts;
}