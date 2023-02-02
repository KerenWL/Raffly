function load_file_as_text(item) {
	return new Promise((res, rej) => {
		item.file((f) => {
			const reader = new FileReader();

			reader.onload = (x) => res(x.target.result);
			reader.onerror = (x) => rej(x);

			reader.readAsText(f);
		}, rej);
	});
}

async function load_drop_story(e, res, rej) {
	const data = e.dataTransfer;
	if (!data.types) return;

	if (data.items.length !== 1) {
		rej("Expected one file, got " + data.items.length);
		return;
	}

	const item = data.items[0].webkitGetAsEntry();

	if (!item.isFile) {
		rej("Expected a file");
		return;
	}

	const file_content = await load_file_as_text( item );
	res( file_content );
}

const state = {
	is_dropping_file: false
}

function load_drop_handler(res, rej) {
	const body = document.querySelector('#loader');

	body.ondragover = e => {
		e.preventDefault();
		const i = e.dataTransfer.items;
		if( Object.keys(i).some(x => i[x].kind=="file") ) {
			state.is_dropping_file = true;
			body.classList.add('hover');
		}
	};
	body.ondragstart = e => {
		e.preventDefault();
		body.classList.add('hover');
	};
	body.ondragleave = e => {
		e.preventDefault();
		state.is_dropping_file = false;
		body.classList.remove('hover');
	};
	body.ondrop = e => {
		if( !state.is_dropping_file ) return;
		e.preventDefault();
		body.classList.remove('hover');
		load_drop_story( e, res, rej );
	};

	console.log("Drop handler loaded!");
}
window.load_drop_handler = load_drop_handler