import { v4 as uuidv4 } from 'uuid';

export default class Aug {

	constructor(id, name="", type="", encoding={}, generate) {
		this._id = id;
		this._name = name;
		this._type = type;
		this._encoding = encoding;
		this._generationCriteria = generate;
	}

	getSpec() {
		return {"id": this._id,
				"name": this._name,
				"type": this._type,
				"encoding": this._encoding,
				"generationCriteria": this._generationCriteria}
	}

}