import {
	App,
	MarkdownView,
	Platform,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	Workspace,
	WorkspaceLeaf,
} from 'obsidian';

//----------------------------------
// Interfaces
//----------------------------------
interface SimpleBannerSettings {
	offset: number;
	radius: Array<number>;
	padding: number;
	fade: boolean;
	desktopHeight: number;
	tabletHeight: number;
	mobileHeight: number;
	propertyName: string;
}

const DEFAULT_SETTINGS: SimpleBannerSettings = {
	offset: -32,
	radius: [8, 8, 8, 8],
	padding: 8,
	fade: true,
	desktopHeight: 240,
	mobileHeight: 160,
	tabletHeight: 190,
	propertyName: 'banner',
}

interface BannerData {
	path: string | null;
	value: string | null;
	isNewValue: boolean;
	isUpdate: boolean;
	viewMode: ViewMode | null;
	lastViewMode: ViewMode | null;
	container: HTMLElement | null;
}

interface BannerOptions {
	x: number;
	y: number;
	repeatable: boolean;
}

enum ViewMode {
	Source = 'source',
	Reading = 'preview',
}

export default class SimpleBanner extends Plugin {
	//---------------------------------------------------
	//
	//  Variables
	//
	//---------------------------------------------------
	workspace: Workspace;
	settings: SimpleBannerSettings;

	//---------------------------------------------------
	//
	//  Plugin Lifecycle
	//
	//---------------------------------------------------
	async onload() {
		this.workspace = this.app.workspace;

		await this.loadSettings();
		this.addSettingTab(new SettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.applySettings();
			this.registerEvent(this.workspace.on('layout-change', this.process.bind(this)));
			this.registerEvent(this.workspace.on('file-open', this.handleFileEvents.bind(this)));
			this.registerEvent(this.app.metadataCache.on('changed', this.handleMetaEvents.bind(this)));
			this.processAll();
		});
	}

	onunload() {
	}

	//---------------------------------------------------
	//
	//  Methods
	//
	//---------------------------------------------------

	processAll() {
		this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			const view = leaf.view as MarkdownView;
			if (view) {
				const file = view?.file || null;
				const options = this.computeBannerData(file, view);
				this.process(options || null);
			}
		});
	}

	process(options?: BannerData | null) {
		const opts = options || this.computeBannerData();
		if (!opts) {
			return;
		}
		if (!opts.value) {
			this.removeBanner();
			return;
		}
		this.updateBanner(opts);
	}

	updateBanner(options: BannerData) {
		const propsContainer = document.querySelector('.metadata-container');
		if (propsContainer) {
			const parent = propsContainer.parentNode;
			if (parent && parent.firstChild !== propsContainer) {
				parent.prepend(propsContainer);
			}
		}

		const { value, isNewValue, isUpdate, viewMode, lastViewMode, container } = options;
		if (lastViewMode !== viewMode || isNewValue) {
			if (container && isNewValue) {
				const view = this.getActiveView();
				const containers = container.querySelectorAll('.markdown-reading-view > .markdown-preview-view, .cm-scroller');
				containers.forEach((c) => {
					let element = (c.querySelector('.simple-banner') || document.createElement('div')) as HTMLElement;
					element.classList.add('simple-banner');

					if (isNewValue) {
						const { url, repeatable, x, y } = this.parseLinkString(value || '', view);

						element.classList.remove('static');
						this.setCSSVariables({
							'--smpbn-url': `url(${url}`,
							'--smpbn-img-x': `${x}px`,
							'--smpbn-img-y': `${y}px`,
							'--smpbn-size': repeatable ? 'auto' : 'cover',
							'--smpbn-repeat': repeatable ? 'repeat' : 'no-repeat',
						}, container);

						if (isUpdate) {
							element.classList.add('static');
						} else {
							c.prepend(element);
							element.onanimationend = () => {
								const banners = document.querySelectorAll('.simple-banner');
								banners.forEach(b => b.classList.add('static'));
							}
						}
					}
				});

				options.isNewValue = false;
				options.lastViewMode = viewMode;
				container.dataset.sb = JSON.stringify(options);
			}
		}
	}

	removeBanner() {
		const options = this.computeBannerData();
		const container = options?.container;
		if (options && container) {
			const targets = container.querySelectorAll('.simple-banner');
			targets.forEach((t) => { t.remove() });
			options.lastViewMode = null;
			options.value = null;
			delete container.dataset.sb;
		}
	}

	computeBannerData(newfile?: TFile | null, targetView?: MarkdownView): BannerData | null {
		const view = targetView || this.getActiveView();
		if (view instanceof MarkdownView) {
			const viewMode = view.getMode() || null;
			const defaultOptions = this.createDefaultBannerData();
			let oldopt: BannerData | null = defaultOptions;
			const container = view.containerEl;
			if (container?.dataset.sb) {
				oldopt = JSON.parse(container.dataset.sb) as BannerData || defaultOptions;
			}
			if (newfile && newfile.path !== view?.file?.path) {
				oldopt = defaultOptions;
			}

			const opt = {
				path: null,
				value: null,
				isNewValue: false,
				isUpdate: false,
				viewMode: (viewMode === ViewMode.Reading) ? ViewMode.Reading : ViewMode.Source,
				lastViewMode: oldopt.viewMode,
				container: view.containerEl,
			} as BannerData;

			const file = view?.file || null;
			if (file) {
				const cachedMetadata = this.app.metadataCache.getFileCache(file);
				const propName = this.settings.propertyName;
				const frontmatter = cachedMetadata?.frontmatter;
				if (frontmatter && frontmatter[propName]) {
					opt.value = frontmatter[propName];
					opt.path = file.path;
					if (oldopt.value !== opt.value) {
						opt.isNewValue = true;
						if (this.isOptionsUpdate(oldopt.value, opt.value, view)) {
							opt.isUpdate = true;
						}
					}
				}
			}
			return opt;
		}
		return null;
	}

	//----------------------------------
	// Settings Methods
	//----------------------------------
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applySettings();
	}

	applySettings() {
		let height = this.settings.desktopHeight;
		if (Platform.isTablet) {
			height = this.settings.tabletHeight;
		} else if (Platform.isMobile) {
			height = this.settings.mobileHeight;
		}

		const offset = this.settings.offset;
		const radius = this.settings.radius;
		const padding = this.settings.padding;
		const fade = this.settings.fade;

		this.setCSSVariables({
			'--smpbn-height': `${height}px`,
			'--smpbn-note-offset': `${offset}px`,
			'--smpbn-radius': `${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px`,
			'--smpbn-padding': `${padding}px`,
			'--smpbn-fade': (fade) ? 'linear-gradient(180deg, black 25%, transparent)' : 'none',
		});
	}

	//----------------------------------
	// Event Handlers
	//----------------------------------
	handleFileEvents(file: TFile) {
		const options = this.computeBannerData(file);
		const container = options?.container;
		if (options && container && file.path !== options.path) {
			delete container.dataset.sb;
			this.process();
		}
	}

	async handleMetaEvents(file: TFile) {
		this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			const view = leaf.view as MarkdownView;
			if (view.file === file) {
				const options = this.computeBannerData(file, view);
				this.process(options || null);
			}
		});
	}

	//----------------------------------
	// Helper Methods
	//----------------------------------
	getActiveView(): MarkdownView | null {
		return this.workspace.getActiveViewOfType(MarkdownView) || null;
	}

	parseLinkString(str: string, view?: MarkdownView | null) {
		let url: string | null = null;
		let displayText: string | null = null;
		let external: boolean;
		let obsidianUrl: boolean = false;
		let options = { x: 0, y: 0, repeatable: false };

		const wikilinkMatch = str.match(/^!?\[\[([^\]]+?)(\|([^\]]+?))?\]\]$/);
		if (wikilinkMatch) {
			url = wikilinkMatch[1].trim();
			displayText = wikilinkMatch[3] ? wikilinkMatch[3].trim() : null;
		}

		const markdownMatch = str.match(/^!?\[([^\]]*)\]\(([^)]+?)\)$/);
		const markdownBareMatch = str.match(/^!?<([^>]+)>$/);
		if (markdownMatch) {
			displayText = markdownMatch[1].trim();
			url = markdownMatch[2].trim();
		} else if (markdownBareMatch) {
			url = markdownBareMatch[1].trim();
			displayText = null;
		}

		if (!url) {
			url = str;
			displayText = null;
		}

		external = /^https?:\/\//i.test(url);

		if (url.startsWith('obsidian://open')) {
			const str = url.replace('obsidian://open', '');
			const params = new URLSearchParams(str);
			let file = params.get('file');
			if (file) {
				url = file;
				obsidianUrl = true;
				external = false;
				displayText = null;
			}
		}

		const hashIndex = url.indexOf('#');
		if ((external || obsidianUrl) && hashIndex !== -1) {
			options = this.parseBannerOptions(url.substring(hashIndex + 1));
			url = url.replace(/#.*/, '').trim();
		}

		if (displayText) {
			options = this.parseBannerOptions(displayText);
		}

		if (!external) {
			const vault = this.app.vault;
			const files = vault.getFiles().filter(f => f.path === url || f.name === url);
			let file = files.find(f => f.path === url);
			if (file) {
				url = vault.getResourcePath(file);
			}
			if (!file) {
				file = files.find(f => f.name === url);
				if (file) {
					url = vault.getResourcePath(file);
				}
			}

			if (obsidianUrl && file && view) {
				const activeFile = this.workspace.getActiveFile();
				if (activeFile) {
					// noinspection JSIgnoredPromiseFromCall
					this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
						const propName = this.settings.propertyName;
						frontmatter[propName] = `[[${file?.path}]]`
					});
				}
			}
		}

		return {
			url: url.trim(),
			external,
			...options,
		};
	}

	parseBannerOptions(str: string): BannerOptions {
		let repeatable: boolean;
		let x = 0;
		let y = 0;

		const values = str.toLowerCase();
		repeatable = values.includes('repeat');

		const sizes = str.split(/x|,/);
		const numbers = sizes.filter(v => !isNaN(parseInt(v.trim(), 10)));

		if (numbers.length === 2) {
			x = parseInt(numbers[0].trim(), 10);
			y = parseInt(numbers[1].trim(), 10);
		} else if (numbers.length === 1) {
			y = parseInt(numbers[0].trim(), 10);
		}
		return { x, y, repeatable };
	}

	isOptionsUpdate(oldstr?: string | null, newstr?: string | null, view?: MarkdownView | null): boolean {
		if (!oldstr || !newstr) {
			return false;
		}
		const oldopt = this.parseLinkString(oldstr, view);
		const newopt = this.parseLinkString(newstr, view);
		return oldopt.url === newopt.url;
	}

	setCSSVariables(variables: Record<string, string>, target: HTMLElement = document.documentElement) {
		const style = target.style;
		Object.keys(variables).forEach(v => {
			style.setProperty(v, variables[v]);
		});
	}

	createDefaultBannerData(): BannerData {
		return {
			path: null,
			value: null,
			isNewValue: false,
			isUpdate: false,
			viewMode: null,
			lastViewMode: null,
			container: null,
		}
	}
}

/**
 * Represents the settings tab for configuring the SimpleBanner plugin.
 *
 */
class SettingTab extends PluginSettingTab {
	plugin: SimpleBanner;

	constructor(app: App, plugin: SimpleBanner) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// GLOBALS
		new Setting(containerEl)
			.setHeading()
			.setName('Global Settings');

		new Setting(containerEl)
			.setName('Note Offset')
			.setDesc('Move the position of the notes content in pixels.')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.offset = DEFAULT_SETTINGS.offset;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(this.plugin.settings.offset.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.offset;
					}
					this.plugin.settings.offset = num;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Border Radius')
			.setDesc('Size of the border radius in pixels.')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.radius = DEFAULT_SETTINGS.radius;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('8')
				.setValue(this.plugin.settings.radius[0].toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.radius[0];
					}
					this.plugin.settings.radius[0] = num;
					await this.plugin.saveSettings();
				})
			)
			.addText(text => text
				.setPlaceholder('8')
				.setValue(this.plugin.settings.radius[1].toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.radius[1];
					}
					this.plugin.settings.radius[1] = num;
					await this.plugin.saveSettings();
				})
			)
			.addText(text => text
				.setPlaceholder('8')
				.setValue(this.plugin.settings.radius[2].toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.radius[2];
					}
					this.plugin.settings.radius[2] = num;
					await this.plugin.saveSettings();
				})
			)
			.addText((text) => {
				text.setPlaceholder('8')
					.setValue(this.plugin.settings.radius[3].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = DEFAULT_SETTINGS.radius[3];
						}
						this.plugin.settings.radius[3] = num;
						await this.plugin.saveSettings();
					});
				text?.inputEl?.parentElement?.classList.add('smpbn-radii');
				return text;
			});

		new Setting(containerEl)
			.setName('Padding')
			.setDesc('Padding of the image from the edges of the note in pixels.')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.padding = DEFAULT_SETTINGS.padding;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(this.plugin.settings.padding.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.padding;
					}
					this.plugin.settings.padding = num;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Fade')
			.setDesc('Fade the image out towards the content.')
			.addToggle(component => component
				.setValue(this.plugin.settings.fade)
				.onChange(async (value) => {
					this.plugin.settings.fade = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setHeading()
			.setName('Height Settings');

		new Setting(containerEl)
			.setName('Desktop')
			.setDesc('Height of the Banner on desktop devices (in pixels).')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.desktopHeight = DEFAULT_SETTINGS.desktopHeight;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(this.plugin.settings.desktopHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.desktopHeight;
					}
					this.plugin.settings.desktopHeight = num;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Tablet')
			.setDesc('Height of the Banner on tablet devices (in pixels).')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.tabletHeight = DEFAULT_SETTINGS.tabletHeight;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(this.plugin.settings.tabletHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.tabletHeight;
					}
					this.plugin.settings.tabletHeight = num;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Mobile')
			.setDesc('Height of the Banner on mobile devices (in pixels).')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.mobileHeight = DEFAULT_SETTINGS.mobileHeight;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(this.plugin.settings.mobileHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.mobileHeight;
					}
					this.plugin.settings.mobileHeight = num;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setHeading()
			.setName('Frontmatter Settings');

		new Setting(containerEl)
			.setName('Property Name')
			.setDesc('Name of the property this plugin should look for in the frontmatter.')
			.addExtraButton(button => button
				.setIcon('rotate-ccw')
				.setTooltip('Restore default')
				.onClick(async () => {
					this.plugin.settings.propertyName = DEFAULT_SETTINGS.propertyName;
					await this.plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Default: banner')
				.setValue(this.plugin.settings.propertyName.toString())
				.onChange(async (value) => {
					this.plugin.settings.propertyName = (value !== '') ? value : DEFAULT_SETTINGS.propertyName;
					await this.plugin.saveSettings();
				})
			);
	}
}
