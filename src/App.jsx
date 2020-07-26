import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { observable, action, toJS } from 'mobx';
import { observer } from 'mobx-react';
import MonacoEditor from 'react-monaco-editor';
import { Rnd } from 'react-rnd';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import {
	Card,
	CardContent,
	Grid,
	List,
	ListItem,
	ListItemAvatar,
	Avatar,
	ListItemText,
	Input,
	AppBar,
	Toolbar,
	IconButton,
	Button,
	Paper,
	ListItemSecondaryAction,
	Breadcrumbs,
	Link,
} from '@material-ui/core';
import { Storage, Clear, Computer, Build, Add, Forward } from '@material-ui/icons';
import { Server } from './types/Server';
import { Client } from './types/Client';
import { Natives } from './types/Natives';

const darkTheme = createMuiTheme({
	palette: {
		type: 'dark',
	},
});

@observer
class App extends Component {
	@observable width = 1000;
	@observable height = 600;

	@observable x = 100;
	@observable y = 100;

	@observable files = [];
	@observable currentFileName = null;
	@observable executionMessage = 'Waiting for file to be executed...';

	@observable isRenamingFile = false;
	@observable isVisible = true;

	pressedEnter = false;
	currentCode = '';

	componentDidMount() {
		alt.emit('vCode::ready');
		alt.on('vCode::open', () => {
			this.showEditor();
			alt.emit('vCode::open', this.isVisible);
		});
		alt.on('vCode::createFile', (type) => {
			if (!this.isVisible) return;
			this.createNewFile(type);
		});
		alt.on('vCode::executeFile', () => {
			if (!this.currentFileName) return;
			if (!this.isVisible) return;
			this.executeFile(this.currentFileName);
		});
		alt.on('vCode::deleteFile', () => {
			if (!this.currentFileName) return;
			if (!this.isVisible) return;
			this.deleteFile(this.currentFileName);
		});
		alt.on('vCode::renameFile', () => {
			if (!this.currentFileName) return;
			if (!this.isVisible) return;
			this.renameFile(this.currentFileName);
		});
	}

	@action
	showEditor() {
		this.isVisible = !this.isVisible;
	}

	@action
	onResize(e, direction, ref, delta, position) {
		this.width = ref.offsetWidth;
		this.height = ref.offsetHeight;
		this.x = position.x;
		this.y = position.y;

		this.editor.layout();
	}

	@action
	onDragStop(e, data) {
		this.x = data.x;
		this.y = data.y;
	}

	editorDidMount(editor, monaco) {
		this.editor = editor;
		this.monaco = monaco;

		this.monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
			noSyntaxValidation: false,
		});

		this.monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ES6,
			allowNonTsExtensions: true,
		});
	}

	@action
	executeFile(fileName) {
		if (this.currentFileName !== fileName) this.editFile(fileName);
		const file = this.files.find((file) => file.name === fileName);

		if (!file) return;

		const errors = this.monaco.editor.getModelMarkers();

		if (errors.length > 0) {
			this.executionMessage = 'Code contains syntax errors...';
			return;
		}

		alt.emit('vCode::execute', file.type, this.currentCode);
		this.executionMessage = `${fileName} was executed successfully!`;
	}

	@action
	editFile(fileName) {
		if (this.currentFileName !== fileName) this.saveCurrentFile();

		const index = this.files.findIndex((file) => file.name === fileName);
		if (index < 0) return;

		const code = this.files[index].code;
		const type = this.files[index].type;

		this.saveCurrentFile();

		this.currentFileName = fileName;
		this.currentCode = code;

		type === 'server'
			? this.monaco.languages.typescript.javascriptDefaults.setExtraLibs([{ content: Server }])
			: this.monaco.languages.typescript.javascriptDefaults.setExtraLibs([
					{ content: Client },
					{ content: Natives },
			  ]);

		this.editor.getModel().setValue(code);
	}

	@action
	renameFile(fileName) {
		const index = this.files.findIndex((file) => file.name === fileName);
		this.files[index].renaming = true;
		this.isRenamingFile = true;
	}

	@action
	deleteFile(fileName) {
		const index = this.files.findIndex((file) => file.name === fileName);
		if (index > -1) this.files.splice(index, 1);

		if (this.currentFileName === fileName) {
			this.currentFileName = null;
			if (this.files.length > 0) this.editFile(this.files[0].name);
		}
	}

	@action
	createNewFile(fileType) {
		const index = this.files.findIndex((file) => file.new === true || file.renaming === true);
		if (index > -1) this.files.splice(index, 1);

		const file = {
			name: '',
			type: fileType,
			code: '',
			renaming: false,
			new: true,
		};

		this.files.unshift(file);
	}

	@action
	onInputBlur(event) {
		if (this.pressedEnter) return;
		this.createFileAfterInput(event);
	}

	@action
	createFileAfterInput(event) {
		if (this.isRenamingFile) {
			if (event.target.value.length > 0) {
				const index = this.files.findIndex((file) => file.renaming === true);
				this.files[index].name = event.target.value;
				this.files[index].renaming = false;

				this.isRenamingFile = false;

				return;
			}

			const index = this.files.findIndex((file) => file.renaming === true);
			this.files[index].renaming = false;

			this.isRenamingFile = false;

			return;
		}

		if (event.target.value.length > 0) {
			const result = this.files.find((file) => file.name === event.target.value);

			if (result) {
				this.files.shift();
				return;
			}

			this.files[0].name = event.target.value;
			this.files[0].code = `// ${this.files[0].name}`;
			this.files[0].new = false;

			this.saveCurrentFile();

			this.currentFileName = this.files[0].name;
			this.currentCode = this.files[0].code;

			this.files[0].type === 'server'
				? this.monaco.languages.typescript.javascriptDefaults.setExtraLibs([{ content: Server }])
				: this.monaco.languages.typescript.javascriptDefaults.setExtraLibs([
						{ content: Client },
						{ content: Natives },
				  ]);

			this.editor.getModel().setValue(this.currentCode);
			this.editor.focus();

			return;
		}

		this.files.shift();

		this.editor.focus();
	}

	@action
	onKeyPress(event) {
		if (event.key === 'Enter') {
			this.pressedEnter = true;
			this.createFileAfterInput(event);
			this.pressedEnter = false;
		}
	}

	@action
	saveCurrentFile() {
		if (this.currentFileName === null) return;

		const index = this.files.findIndex((file) => this.currentFileName === file.name);
		if (index > -1) this.files[index].code = this.currentCode;
	}

	@action
	openFileContextMenu(e) {
		e.preventDefault();

		this.fileMouseX = e.clientX;
		this.fileMouseY = e.clientY;
	}

	render() {
		return (
			<ThemeProvider theme={darkTheme}>
				<div style={{ width: '100vw', height: '100vh', padding: 50 }}>
					<div style={{ width: '100%', height: '100%' }}>
						<Rnd
							size={{ width: this.width, height: this.height }}
							position={{ x: this.x, y: this.y }}
							minWidth='800'
							minHeight='400'
							onResize={this.onResize.bind(this)}
							onDragStop={this.onDragStop.bind(this)}
							cancel='.no-drag'
							bounds='parent'
						>
							<Card
								style={{
									width: this.width,
									height: this.height,
									backgroundColor: 'rgba(34,34,34,.95)',
									display: this.isVisible ? 'block' : 'none',
								}}
							>
								<CardContent>
									<Grid container spacing={1}>
										<Grid item xs={12}>
											<AppBar position='static' style={{ backgroundColor: '#4e753e' }}>
												<Toolbar>
													<Button
														startIcon={<Add />}
														onClick={() => this.createNewFile('server')}
													>
														Server <strong style={{ marginLeft: 8 }}>F5</strong>
													</Button>
													<Button
														startIcon={<Add />}
														onClick={() => this.createNewFile('client')}
													>
														Client <strong style={{ marginLeft: 8 }}>F6</strong>
													</Button>
													{this.currentFileName !== null ? (
														<Button
															startIcon={<Forward />}
															onClick={() => this.executeFile(this.currentFileName)}
														>
															Execute <strong style={{ marginLeft: 8 }}>F7</strong>
														</Button>
													) : (
														''
													)}
													<div style={{ flexGrow: 1 }} />
													<IconButton
														variant='square'
														onClick={() => alt.emit('vCode::open', false)}
													>
														<Clear />
													</IconButton>
												</Toolbar>
											</AppBar>
										</Grid>
										<Grid item xs={3} className='no-drag'>
											<List style={{ overflowY: 'scroll', height: this.height - 125 }} item>
												{this.files.map((file) => {
													return file.new === false && file.renaming === false ? (
														<div
															key={file.name}
															onContextMenu={(e) => this.openFileContextMenu(e)}
															onDoubleClick={(e) => this.editFile(file.name)}
															style={{
																cursor: 'context-menu',
																userSelect: 'none',
															}}
														>
															<ListItem>
																<ListItemAvatar>
																	<Avatar
																		variant='square'
																		style={{
																			backgroundColor:
																				file.name === this.currentFileName
																					? '#3d6594'
																					: '#4e753e',
																		}}
																	>
																		{file.type === 'server' ? (
																			<Storage />
																		) : (
																			<Computer />
																		)}
																	</Avatar>
																</ListItemAvatar>
																<ListItemText
																	primary={
																		<div
																			style={{
																				color:
																					this.currentFileName === file.name
																						? '#3d6594'
																						: '#4e753e',
																			}}
																		>
																			{file.name}
																		</div>
																	}
																	secondary={
																		<Breadcrumbs
																			style={{ fontSize: 10 }}
																			aria-label='breadcrumb'
																		>
																			<Link
																				color='inherit'
																				onClick={() =>
																					this.renameFile(file.name)
																				}
																			>
																				Rename
																			</Link>
																			<Link
																				color='inherit'
																				onClick={() =>
																					this.deleteFile(file.name)
																				}
																			>
																				Delete
																			</Link>
																		</Breadcrumbs>
																	}
																/>
																<ListItemSecondaryAction>
																	<IconButton
																		edge='end'
																		onClick={() => this.executeFile(file.name)}
																	>
																		<Build />
																	</IconButton>
																</ListItemSecondaryAction>
															</ListItem>
														</div>
													) : (
														<ListItem key={file.name}>
															<ListItemAvatar>
																<Avatar
																	variant={this.isRenamingFile ? 'square' : 'rounded'}
																	style={{ backgroundColor: '#4e753e' }}
																>
																	<Build />
																</Avatar>
															</ListItemAvatar>
															<Input
																onKeyPress={(e) => this.onKeyPress(e)}
																onBlur={(e) => this.onInputBlur(e)}
																autoFocus={true}
															/>
														</ListItem>
													);
												})}
											</List>
										</Grid>
										<Grid item xs={9} className='no-drag'>
											<MonacoEditor
												ref='monaco'
												height={this.height - 125}
												editorDidMount={this.editorDidMount.bind(this)}
												language='javascript'
												theme='vs-dark'
												options={{ automaticLayout: true }}
												onChange={(newValue) => (this.currentCode = newValue)}
											/>
										</Grid>
										<Paper style={{ padding: '3px 10px', width: '100%' }} elevation={0}>
											{this.executionMessage}
										</Paper>
									</Grid>
								</CardContent>
							</Card>
						</Rnd>
					</div>
				</div>
			</ThemeProvider>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('root'));
