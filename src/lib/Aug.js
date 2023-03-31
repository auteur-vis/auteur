import { v4 as uuidv4 } from 'uuid';

export default class Aug {

	constructor(data) {
		this._data = data;
		this._id = `aug${uuidv4()}`;
		this.name = "AugBase";
		this.target = [];
		this.type = "";
		this.style = {};
		this.encoding = {};
	}

}