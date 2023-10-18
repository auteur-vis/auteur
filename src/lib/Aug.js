import { v4 as uuidv4 } from 'uuid';

export default class Aug {

	constructor(id, name="", type="", encoding={}, generator, styles, rank) {

		this._id = id;
		this._name = name;
		this._type = type;
		this._encoding = encoding;
		this._generator = generator;
		this._styles = styles;
		this._rank = rank;
	}

	getSpec() {
		return {"id": this._id,
				"name": this._name,
				"type": this._type,
				"encoding": this._encoding,
				"generator": this._generator,
				"styles": this._styles,
				"rank": this._rank
			}
	}

}