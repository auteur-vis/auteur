import { v4 as uuidv4 } from 'uuid';

export default class DataFact {

	constructor() {
		this._id = `df${uuidv4()}`;
		this.name = "DFBase";
		this.target = [];
	}

}