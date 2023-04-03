import { v4 as uuidv4 } from 'uuid';

export default class Aug {

	constructor(name="", target=[], type="", style={}, encoding={}) {
		// this._data = data; 
		this._id = `aug${uuidv4()}`;
		this.name = name;
		this.target = target;
		this.type = type;
		this.style = style;
		this.encoding = encoding;
	}

	getSpec() {
		return {"id": this._id,
				"name": this.name,
				"target": this.target,
				"type": this.type,
				"style": this.style,
				"encoding": this.encoding}
	}

}