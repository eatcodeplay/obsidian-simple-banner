import { MarkdownView, Plugin, TFile, WorkspaceLeaf, } from 'obsidian';
import { BannerData, DeviceSettings, PropertySettings, SimpleBannerSettings } from './types/interfaces';
import { CSSClasses, CSSValue, ViewMode } from './types/enums';
import Settings from './settings/settings';
import SettingsMigrator from './settings/migrator';
import Store from './data/store';
import DomUtils from './utils/domutils';
import Parse from './utils/parse';
import Banner from './feature/banner';
import Icon from './feature/icon';
import Datetime from './feature/datetime';
import PluginInterOp from './feature/interop';

export default class SimpleBanner extends Plugin {
	//---------------------------------------------------
	//
	//  Variables
	//
	//---------------------------------------------------
	public settings: SimpleBannerSettings;
	public settingProperties: PropertySettings;
	protected deviceSettings: DeviceSettings;
	protected featBanner: Banner;
	protected featIcon: Icon;
	protected featDatetime: Datetime;
	protected featPluginInterop: PluginInterOp;

	//---------------------------------------------------
	//
	//  Plugin Lifecycle
	//
	//---------------------------------------------------
	async onload() {
		const app = this.app;
		const workspace = app.workspace;

		Parse.init(this);
		DomUtils.init(this);

		await this.loadSettings();
		this.addSettingTab(new Settings(app, this));

		this.featBanner = new Banner(this, this.deviceSettings);
		this.featIcon = new Icon(this, this.deviceSettings);
		this.featDatetime = new Datetime(this, this.deviceSettings);
		this.featPluginInterop = new PluginInterOp(this, this.deviceSettings);

		workspace.onLayoutReady(() => {
			this.registerEvent(workspace.on('layout-change', this.handleLayoutChange.bind(this)));
			this.registerEvent(workspace.on('file-open', this.handleFileOpen.bind(this)));
			this.registerEvent(app.metadataCache.on('changed', this.handleMetaChange.bind(this)));
			this.applySettings();
		});
	}

	onunload() {
		const { featBanner, featIcon, featDatetime, featPluginInterop } = this;
		featBanner.destroy();
		featIcon.destroy();
		featDatetime.destroy();
		featPluginInterop.destroy();
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
					this.process(file, view);
				} else {
					this.remove();
				}
			}
		});
	}

	async process(file?: TFile | null, view?: MarkdownView) {
		const data = await this.compute(file, view);
		if (!data) {
			return;
		}
		if (!data.image) {
			this.remove(data);
			return;
		}
		if (!data.icon) {
			data.needsUpdate = true;
		}
		if (this.deviceSettings.bannerEnabled) {
			this.render(data);
		}
	}

	async compute(file?: TFile | null, targetView?: MarkdownView): Promise<BannerData | null> {
		const view = targetView || this.getActiveView();
		if (file && view instanceof MarkdownView) {
			const defaultData = this.createDefaultBannerData();
			// @ts-ignore
			const olddata: BannerData | null = Store.get(view?.leaf.id) || defaultData;
			const newdata = this.createDefaultBannerData(view, olddata.viewMode);
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;

			if (frontmatter) {
				const settingProps = this.settingProperties;
				const imageProp = settingProps.image;
				const iconProp = settingProps.icon;
				const datetimeProp = settingProps.datetime;

				// parse for image property
				if (frontmatter[imageProp]) {
					newdata.image = frontmatter[imageProp];
					newdata.filepath = file.path;
					if (olddata.filepath !== newdata.filepath) {
						newdata.needsUpdate = true;
						newdata.isImageChange = true;
					} else if (olddata.image !== newdata.image) {
						newdata.needsUpdate = true;
						newdata.isImageChange = true;
						if (await Parse.isImagePropertiesUpdate(olddata.image, newdata.image, view)) {
							newdata.isImagePropsUpdate = true;
							newdata.isImageChange = false;
						}
					}
				}

				// parse for icon property if enabled
				if (this.deviceSettings.iconEnabled) {
					if (frontmatter[iconProp]) {
						newdata.icon = frontmatter[iconProp];
						newdata.filepath = file.path;
						if (olddata.icon !== newdata.icon) {
							newdata.needsUpdate = true;
						}
					} else if (olddata.icon) {
						newdata.icon = null;
						newdata.needsUpdate = true;
					}
				}

				// parse for datetime property if enabled
				if (this.deviceSettings.datetimeEnabled) {
					if (frontmatter[datetimeProp]) {
						newdata.datetime = frontmatter[datetimeProp];
						newdata.filepath = file.path;
						if (olddata.datetime !== newdata.datetime) {
							newdata.needsUpdate = true;
						}
					} else if (olddata.datetime) {
						newdata.datetime = null;
						newdata.needsUpdate = true;
					}
				}
			}
			return newdata;
		}
		return null;
	}

	async render(data: BannerData) {
		const { image, viewMode, lastViewMode, view, needsUpdate, isImageChange } = data;
		const container = view?.containerEl;
		if (container && (lastViewMode !== viewMode || needsUpdate)) {
			const containers = container.querySelectorAll('.cm-scroller, .markdown-reading-view > .markdown-preview-view') as NodeListOf<HTMLElement>;
			const imageOptions = await Parse.link(image || '', view);
			const {
				featBanner,
				featIcon,
				featDatetime,
				featPluginInterop,
			} = this;

			const banners = featBanner.update(data, imageOptions, containers);
			featIcon.update(data, banners);
			featDatetime.update(data, banners);
			featPluginInterop.update(data, banners);

			if (!isImageChange) {
				featBanner.replace(banners);
			} else {
				featBanner.inject(banners, containers);
			}

			featDatetime.check();

			data.lastViewMode = viewMode;
			container.dataset.sb = '';
			// @ts-ignore
			Store.set(view?.leaf.id, data);
		}
	}

	remove(data?: BannerData) {
		const view = data?.view || this.getActiveView();
		if (view instanceof MarkdownView) {
			const container = view?.containerEl;
			if (container) {
				const targets = container.querySelectorAll(`.${CSSClasses.Main}`);
				targets.forEach((t) => {
					t.remove()
				});
				// @ts-ignore
				Store.delete(view?.leaf.id);
				delete container.dataset.sb;
			}
		}
	}

	//----------------------------------
	// Settings Methods
	//----------------------------------
	async loadSettings() {
		const data = await this.loadData();
		const mergedData = Settings.prepare(data);
		this.settings = await SettingsMigrator.migrate(mergedData, this);
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
		const noteOffset = settings.noteOffset;
		const viewOffset = settings.viewOffset;
		const radius = settings.bannerRadius;
		const padding = settings.bannerPadding;
		const fade = settings.bannerFade;
		const vars = {} as any;

		vars['height'] = `${height}px`;
		vars['note-offset'] = `${noteOffset}px`;
		vars['view-offset'] = `${viewOffset}px`;
		vars['radius'] = `${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px`;
		vars['padding'] = `${padding}px`;
		vars['mask'] = (fade) ? CSSValue.RevertLayer : CSSValue.Initial;

		if (settings.iconEnabled) {
			const iconSize = settings.iconSize;
			const iconRadius = settings.iconRadius;
			const iconBackground = settings.iconBackground;
			const iconBorder = settings.iconBorder;
			const iconAlignment = settings.iconAlignment;
			const iconOffset = settings.iconOffset;

			vars['icon-size-w'] = `${iconSize}px`;
			vars['icon-size-h'] = `${iconSize}px`;
			vars['icon-radius'] = `${iconRadius}px`;
			vars['icon-align-h'] = iconAlignment[0];
			vars['icon-align-v'] = iconAlignment[1];
			vars['icon-offset-x'] = `${iconOffset[0]}px`;
			vars['icon-offset-y'] = `${iconOffset[1]}px`;
			vars['icon-border'] = `${iconBorder}px`;
			vars['icon-background'] = iconBackground ? CSSValue.RevertLayer : CSSValue.Transparent;
		}

		if (settings.datetimeEnabled) {
			const dtAlignment = settings.datetimeAlignment;
			const dtOffset = settings.datetimeOffset;
			vars['dt-align-h'] = dtAlignment[0];
			vars['dt-align-v'] = dtAlignment[1];
			vars['dt-offset-x'] = `${dtOffset[0]}px`;
			vars['dt-offset-y'] = `${dtOffset[1]}px`;
		}

		DomUtils.setCSSVariables(vars);

		if (this.settings.properties.autohide) {
			document.body.classList.add(CSSClasses.Autohide);
		} else {
			document.body.classList.remove(CSSClasses.Autohide);
		}

		this.processAll();
	}

	//----------------------------------
	// Event Handlers
	//----------------------------------
	handleLayoutChange() {
		const view = this.getActiveView();
		if (view) {
			if (this.settings.properties.autohide) {
				const propsContainer = document.querySelector('.metadata-container');
				const parent = propsContainer?.parentNode;
				if (parent && parent.firstChild !== propsContainer) {
					parent.prepend(propsContainer);
				}
			}
			// @ts-ignore
			if (!Store.exists(view?.leaf.id)) {
				this.process(view.file, view);
			}
		} else {
			Store.delete(this.getMostRecentLeafId());
		}
		this.featDatetime.check();
	}

	handleFileOpen(file: TFile) {
		const view = this.getActiveView();
		if (view instanceof MarkdownView) {
			this.process(file, view);
		}
	}

	handleMetaChange(file: TFile) {
		this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			const view = leaf.view as MarkdownView;
			if (view.file === file) {
				this.process(file, view);
			}
		});
	}

	//----------------------------------
	// Helper Methods
	//----------------------------------
	getActiveView(): MarkdownView | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView) || null;
	}

	getMostRecentLeafId(): string | null {
		const leaf = this.app.workspace.getMostRecentLeaf();
		// @ts-ignore
		return leaf.id;
	}

	createDefaultBannerData(view?: MarkdownView | null, lastViewMode?: ViewMode | null): BannerData {
		let viewMode = null;
		if (view) {
			viewMode = ((view.getMode() || null) === ViewMode.Reading) ? ViewMode.Reading : ViewMode.Source;
		}
		return {
			filepath: null,
			image: null,
			icon: null,
			datetime: null,
			viewMode,
			lastViewMode: lastViewMode || null,
			isImagePropsUpdate: false,
			isImageChange: false,
			needsUpdate: false,
			view,
		}
	}
}
