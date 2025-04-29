import {
	MarkdownView,
	Platform,
	Plugin,
	TFile,
	Workspace,
	WorkspaceLeaf,
} from 'obsidian';
import {
	Settings,
	SettingsMigrator,
	SimpleBannerSettings,
	PropertySettings,
	DeviceSettings,
} from "./settings";

//----------------------------------
// Interfaces
//----------------------------------
interface BannerData {
	filepath: string | null;
	image: string | null;
	icon: string | null,
	viewMode: ViewMode | null;
	lastViewMode: ViewMode | null;
	isImageChange: boolean;
	isImagePropsUpdate: boolean;
	isIconChange: boolean;
	needsUpdate: boolean;
	container: HTMLElement | null;
}

interface ImageProperties {
	x: number;
	y: number;
	repeatable: boolean;
}

interface IconData {
	value: string | null,
	type: IconType,
}

enum IconType {
	Link = 'link',
	Text = 'text',
}

enum ViewMode {
	Source = 'source',
	Reading = 'preview',
}

const RegExpression = {
	Wikilink: /^!?\[\[([^\]]+?)(\|([^\]]+?))?\]\]$/,
	Markdown: /^!?\[([^\]]*)\]\(([^)]+?)\)$/,
	MarkdownBare: /^!?<([^>]+)>$/,
	Weblink: /^https?:\/\//i,
};

export default class SimpleBanner extends Plugin {
	//---------------------------------------------------
	//
	//  Variables
	//
	//---------------------------------------------------
	workspace: Workspace;
	settings: SimpleBannerSettings;
	deviceSettings: DeviceSettings;
	settingProperties: PropertySettings;


	//---------------------------------------------------
	//
	//  Plugin Lifecycle
	//
	//---------------------------------------------------
	async onload() {
		this.workspace = this.app.workspace;

		await this.loadSettings();
		this.addSettingTab(new Settings(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.workspace.on('layout-change', this.process.bind(this)));
			this.registerEvent(this.workspace.on('file-open', this.handleFileEvents.bind(this)));
			this.registerEvent(this.app.metadataCache.on('changed', this.handleMetaEvents.bind(this)));
			this.applySettings();
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
				if (this.deviceSettings.bannerEnabled) {
					const file = view?.file || null;
					const options = this.computeBannerData(file, view);
					this.process(options || null);
				} else {
					this.removeBanner();
				}
			}
		});
	}

	process(options?: BannerData | null) {
		const opts = options || this.computeBannerData();
		if (!opts) {
			return;
		}
		if (!opts.image) {
			this.removeBanner();
			return;
		}
		if (!opts.icon) {
			opts.needsUpdate = true;
		}
		if (this.deviceSettings.bannerEnabled) {
			this.updateBanner(opts);
		}
	}

	updateBanner(options: BannerData) {
		const {
			image,
			icon,
			viewMode,
			lastViewMode,
			container,
			needsUpdate,
			isImageChange,
			isImagePropsUpdate,
			isIconChange,
		} = options;

		const propsContainer = document.querySelector('.metadata-container');
		if (propsContainer) {
			const parent = propsContainer.parentNode;
			if (parent && parent.firstChild !== propsContainer) {
				parent.prepend(propsContainer);
			}
		}

		if (container && (lastViewMode !== viewMode || needsUpdate)) {
			const view = this.getActiveView();
			let calculatedFontSize: string | null = null;
			const { url, repeatable, x, y } = this.parseLinkString(image || '', view);
			const containers = container.querySelectorAll('.markdown-reading-view > .markdown-preview-view, .cm-scroller');
			containers.forEach((c) => {
				let element = (c.querySelector('.simple-banner') || document.createElement('div')) as HTMLElement;
				element.classList.add('simple-banner');

				const STATIC_CSS = 'static';

				if (isImageChange || isImagePropsUpdate) {
					if (isImageChange) {
						element.classList.remove(STATIC_CSS);
					}

					this.setCSSVariables({
						'url': `url(${url})`,
						'img-x': `${x}px`,
						'img-y': `${y}px`,
						'size': repeatable ? 'auto' : 'cover',
						'repeat': repeatable ? 'repeat' : 'no-repeat',
					}, container);
				}

				if (isIconChange) {
					let iconContainer = element.querySelector('.icon');
					const hadIconContainer = iconContainer !== null;
					if (this.deviceSettings.iconEnabled && icon) {
						if (!hadIconContainer) {
							iconContainer = document.createElement('div');
							iconContainer.classList.add('icon');
							if (Platform.isWin) {
								iconContainer.classList.add('is-windows');
							}
							const div = document.createElement('div');
							iconContainer.appendChild(div);
							element.prepend(iconContainer);
						}

						if (iconContainer) {
							const iconelement = iconContainer.querySelector('div') as HTMLElement;

							let { value, type } = this.getIconData(icon, view);
							value = value?.replace(/([#.:[\\]"])/g, '\\$1') || '';
							iconelement.dataset.type = type;

							const iconVars = {} as any;
							iconVars['icon'] = type === IconType.Link ? `url(${value})` : `"${value}"`;

							if (type === IconType.Text) {
								calculatedFontSize = calculatedFontSize !== null ? calculatedFontSize : this.getFontsize(value);
								iconVars['icon-fontsize'] = calculatedFontSize;
							}
							this.setCSSVariables(iconVars, iconelement);
						}
					} else if (iconContainer) {
						options.icon = null;
						iconContainer.remove();
					}
				}

				if (!isImageChange) {
					element.classList.add(STATIC_CSS);
				} else {
					c.prepend(element);
					element.onanimationend = () => {
						const banners = document.querySelectorAll('.simple-banner');
						banners.forEach(b => b.classList.add(STATIC_CSS));
					}
				}
			});

			options.lastViewMode = viewMode;
			container.dataset.sb = JSON.stringify(options);
		}
	}

	removeBanner() {
		const options = this.computeBannerData();
		const container = options?.container;
		if (options && container) {
			const targets = container.querySelectorAll('.simple-banner');
			targets.forEach((t) => { t.remove() });
			delete container.dataset.sb;
		}
	}

	computeBannerData(newfile?: TFile | null, targetView?: MarkdownView): BannerData | null {
		const view = targetView || this.getActiveView();
		if (view instanceof MarkdownView) {
			const defaultOptions = this.createDefaultBannerData();
			let oldopt: BannerData | null = defaultOptions;
			const container = view.containerEl;

			if (newfile && newfile.path !== view?.file?.path) {
				oldopt = defaultOptions;
			} else if (container?.dataset.sb) {
				oldopt = JSON.parse(container.dataset.sb) as BannerData || defaultOptions;
			}

			const opt = this.createDefaultBannerData(view, oldopt.viewMode);
			const file = view?.file || null;
			if (file) {
				const cachedMetadata = this.app.metadataCache.getFileCache(file);
				const frontmatter = cachedMetadata?.frontmatter;

				if (frontmatter) {
					const settingProps = this.settingProperties;
					const imageProp = settingProps.image;
					const iconProp = settingProps.icon;

					// parse for image property
					if (frontmatter[imageProp]) {
						opt.image = frontmatter[imageProp];
						opt.filepath = file.path;
						if (oldopt.image !== opt.image) {
							opt.needsUpdate = true;
							opt.isImageChange = true;
							if (this.isImagePropertiesUpdate(oldopt.image, opt.image, view)) {
								opt.isImagePropsUpdate = true;
								opt.isImageChange = false;
							}
						}
					}

					// parse for icon property if enabled
					if (this.deviceSettings.iconEnabled) {
						if (frontmatter[iconProp]) {
							opt.icon = frontmatter[iconProp];
							opt.filepath = file.path;
							if (oldopt.icon !== opt.icon) {
								opt.needsUpdate = true;
								opt.isIconChange = true;
							}
						} else if (oldopt.icon) {
							opt.icon = null;
							opt.needsUpdate = true;
							opt.isIconChange = true;
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
		const data = await this.loadData();
		this.settings = await SettingsMigrator.migrate(Object.assign({}, Settings.DEFAULT_SETTINGS, data), this);
		this.deviceSettings = this.settings[Settings.currentDevice];
		this.settingProperties = this.settings.properties;
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applySettings();
	}

	applySettings() {
		const settings = this.deviceSettings;
		const height = settings.height;
		const offset = settings.noteOffset;
		const radius = settings.bannerRadius;
		const padding = settings.bannerPadding;
		const fade = settings.bannerFade;
		const vars = {} as any;

		vars['height'] = `${height}px`;
		vars['note-offset'] = `${offset}px`;
		vars['radius'] = `${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px`;
		vars['padding'] = `${padding}px`;
		vars['fade'] = (fade) ? 'linear-gradient(180deg, var(--background-primary) 25%, transparent)' : 'none';

		if (settings.iconEnabled) {
			const iconSize = settings.iconSize;
			const iconRadius = settings.iconRadius;
			const iconBackground = settings.iconBackground;
			const iconBorder = settings.iconBorder;
			const iconAlignment = settings.iconAlignment;
			const iconOffset = settings.iconOffset;

			vars['icon-size'] = `${iconSize}px`;
			vars['icon-radius'] = `${iconRadius}px`;
			vars['icon-background'] = iconBackground ? 'var(--background-primary)' : 'transparent';
			vars['icon-border'] = `${iconBorder}px`;
			vars['icon-alignh'] = iconAlignment[0];
			vars['icon-alignv'] = iconAlignment[1];
			vars['icon-offset-x'] = `${iconOffset[0]}px`;
			vars['icon-offset-y'] = `${iconOffset[1]}px`;
		}

		this.setCSSVariables(vars);

		const AUTOHIDE_CLASS = 'smpbn-autohide';
		if (this.settings.properties.autohide) {
			document.body.classList.add(AUTOHIDE_CLASS);
		} else {
			document.body.classList.remove(AUTOHIDE_CLASS);
		}

		this.processAll();
	}

	//----------------------------------
	// Event Handlers
	//----------------------------------
	handleFileEvents(file: TFile) {
		const options = this.computeBannerData(file);
		const container = options?.container;
		if (options && container && file.path !== options.filepath) {
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

	parseLinkString(str: string, view?: MarkdownView | null, settingProperty?: string | null) {
		let url: string | null = null;
		let displayText: string | null = null;
		let external: boolean;
		let obsidianUrl: boolean = false;
		let options = { x: 0, y: 0, repeatable: false };

		const wikilinkMatch = str.match(RegExpression.Wikilink);
		if (wikilinkMatch) {
			url = wikilinkMatch[1].trim();
			displayText = wikilinkMatch[3] ? wikilinkMatch[3].trim() : null;
		}

		const markdownMatch = str.match(RegExpression.Markdown);
		const markdownBareMatch = str.match(RegExpression.MarkdownBare);
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

		external = RegExpression.Weblink.test(url);

		if (this.isObsidianUrl(url)) {
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
			options = this.parseImageProperties(url.substring(hashIndex + 1));
			url = url.replace(/#.*/, '').trim();
		}

		if (displayText) {
			options = this.parseImageProperties(displayText);
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
						const propName = settingProperty || this.settingProperties.image;
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

	isObsidianUrl(url: string): boolean {
		return url.startsWith('obsidian://open');
	}

	parseImageProperties(str: string): ImageProperties {
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

	isImagePropertiesUpdate(oldstr?: string | null, newstr?: string | null, view?: MarkdownView | null): boolean {
		if (!oldstr || !newstr) {
			return false;
		}
		const oldopt = this.parseLinkString(oldstr, view);
		const newopt = this.parseLinkString(newstr, view);
		return oldopt.url === newopt.url;
	}

	getIconData(icon: string, view?: MarkdownView | null): IconData {
		const str = icon || '';
		const out = { value: null, type: IconType.Text } as IconData;

		if (RegExpression.Wikilink.test(str)) {
			out.type = IconType.Link;
		} else if (RegExpression.Markdown.test(str) || RegExpression.MarkdownBare.test(str)) {
			out.type = IconType.Link;
		} else if (RegExpression.Weblink.test(icon)) {
			out.type = IconType.Link;
		} else if (this.isObsidianUrl(icon)) {
			out.type = IconType.Link;
		}

		if (out.type === IconType.Link) {
			const data = this.parseLinkString(str, view, this.settingProperties.icon);
			out.value = data.url;
		} else {
			out.value = str;
		}

		return out;
	}

	getFontsize(textContent: string) {
		const temp = document.createElement('span');
		temp.setAttribute('style', 'position: absolute; visibility: hidden; white-space: nowrap;');
		temp.style.padding = '0';
		temp.style.margin = '0';
		temp.style.left = '-9999px';
		temp.textContent = textContent;
		document.body.appendChild(temp);
		const size = this.deviceSettings.iconSize;
		const checkWidth = size - 16;

		let fontSize = size; // Start big
		temp.style.fontSize = fontSize + 'px';

		while (temp.offsetWidth > checkWidth && fontSize > 1) {
			fontSize -= 1;
			temp.style.fontSize = fontSize + 'px';
		}

		document.body.removeChild(temp);
		return `${fontSize}px`;
	}

	createDefaultBannerData(view?: MarkdownView | null, lastViewMode?: ViewMode | null): BannerData {
		let viewMode = null;
		let container = null;
		if (view) {
			viewMode = ((view.getMode() || null) === ViewMode.Reading) ? ViewMode.Reading : ViewMode.Source;
			container = view.containerEl;
		}
		return {
			filepath: null,
			image: null,
			icon: null,
			viewMode,
			lastViewMode: lastViewMode || null,
			isImagePropsUpdate: false,
			isImageChange: false,
			isIconChange: false,
			needsUpdate: false,
			container,
		}
	}

	setCSSVariables(variables: Record<string, string>, target: HTMLElement = document.body) {
		const style = target.style;
		Object.keys(variables).forEach(k => {
			style.setProperty(`--smpbn-${k}`, variables[k]);
		});
	}
}
