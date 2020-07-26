import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';

export class App extends React.Component<{}, { code: string }> {
	public constructor(props: Readonly<{}>) {
		super(props);
		this.state = {
			code: '// type your code...',
		};
	}

	editorDidMount(editor, monaco) {
		console.log('editorDidMount', editor);
		editor.focus();
	}
	onChange(newValue, e) {
		console.log('onChange', newValue, e);
	}
	render() {
		const code = this.state.code;
		const options = {
			selectOnLineNumbers: true,
		};
		return <MonacoEditor />;
	}
}
