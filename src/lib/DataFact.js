import { v4 as uuidv4 } from 'uuid';

export default class DataFact {

	constructor(data) {
		this._data = data;
		this._id = `df${uuidv4()}`;
		this.name = "DFBase";
		// this.target = [];
		// this.type = "";
		// this.style = {};
		// this.encoding = {};
	}

}