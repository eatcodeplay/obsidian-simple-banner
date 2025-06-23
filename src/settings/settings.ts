import { App, Platform, PluginSettingTab, sanitizeHTMLToDom, Setting } from 'obsidian';
import SimpleBanner from '../main';
import { DeviceType } from '../types/enums';
import { SettingCompOptions, SimpleBannerSettings } from '../types/interfaces';

const DEFAULT_SETTINGS: SimpleBannerSettings = {
	desktop: {
		bannerEnabled: true,
		height: 240,
		viewOffset: 0,
		noteOffset: -32,
		bannerRadius: [8, 8, 8, 8],
		bannerPadding: 8,
		bannerFade: true,

		iconEnabled: false,
		iconSize: 96,
		iconRadius: 8,
		iconBackground: true,
		iconBorder: 2,
		iconAlignment: ['flex-start', 'flex-end'],
		iconOffset: [0, -24],

		datetimeEnabled: false,
		datetimeOnPropOnly: false,
		datetimeAlignment: ['flex-end', 'flex-start'],
		datetimeOffset: [0, 0],
		datetimeTimeFormat: 'HH:mm',
		datetimeDateFormat: 'dddd, MMMM Do YYYY',

		interop: {
		},
	},

	tablet: {
		bannerEnabled: true,
		height: 190,
		viewOffset: 0,
		noteOffset: -32,
		bannerRadius: [8, 8, 8, 8],
		bannerPadding: 8,
		bannerFade: true,

		iconEnabled: false,
		iconSize: 96,
		iconRadius: 8,
		iconBackground: true,
		iconBorder: 2,
		iconAlignment: ['flex-start', 'flex-end'],
		iconOffset: [0, -24],

		datetimeEnabled: false,
		datetimeOnPropOnly: false,
		datetimeAlignment: ['flex-end', 'flex-start'],
		datetimeOffset: [0, 0],
		datetimeTimeFormat: 'HH:mm',
		datetimeDateFormat: 'dddd, MMMM Do YYYY',

		interop: {
		},
	},

	phone: {
		bannerEnabled: true,
		height: 160,
		viewOffset: 0,
		noteOffset: -32,
		bannerRadius: [8, 8, 8, 8],
		bannerPadding: 8,
		bannerFade: true,

		iconEnabled: false,
		iconSize: 56,
		iconRadius: 8,
		iconBackground: true,
		iconBorder: 2,
		iconAlignment: ['flex-start', 'flex-end'],
		iconOffset: [0, -24],

		datetimeEnabled: false,
		datetimeOnPropOnly: false,
		datetimeAlignment: ['flex-end', 'flex-start'],
		datetimeOffset: [0, 0],
		datetimeTimeFormat: 'HH:mm',
		datetimeDateFormat: 'dddd, MMMM Do YYYY',

		interop: {
		},
	},

	properties: {
		autohide: true,
		image: 'banner',
		icon: 'icon',
		datetime: 'datetime',
	},
}
const ICON_RESET = 'rotate-ccw';
const TEXT_RESET = 'Restore default';

/**
 * Represents the settings tab for configuring the SimpleBanner plugin.
 *
 */
export default class Settings extends PluginSettingTab {
	plugin: SimpleBanner;

	constructor(app: App, plugin: SimpleBanner) {
		super(app, plugin);
		this.plugin = plugin;
	}

	static get currentDevice(): DeviceType {
		if (Platform.isPhone) {
			return DeviceType.Phone;
		}
		if (Platform.isTablet) {
			return DeviceType.Tablet;
		}
		return DeviceType.Desktop;
	}

	static prepare(data: any): SimpleBannerSettings {
		const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);
		const merged: SimpleBannerSettings = { ...DEFAULT_SETTINGS };

		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				const dataValue = data[key];
				if (isObject(dataValue) && merged.hasOwnProperty(key) && isObject(merged[key])) {
					merged[key] = { ...merged[key], ...dataValue };
				} else {
					merged[key] = dataValue as any;
				}
			}
		}
		return merged;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const currentDevice = Settings.currentDevice;
		const settings = this.plugin.settings[currentDevice];

		this.createBannerSettings();
		if (settings.bannerEnabled) {
			this.createFrontmatterSettings();
			this.createIconSettings();
			this.createDatetimeSettings();
			// this.createInteropSettings();
		}
	}

	createBannerSettings() {
		const currentDevice = Settings.currentDevice;
		const settings = this.plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];

		this.addToggle({
			title: 'Show simple banner',
			description: `Enable or disable Simple Banner on your ${currentDevice} device.`,
			refreshOnUpdate: true,
		}, settings, 'bannerEnabled');

		if (settings.bannerEnabled) {
			this.addNumber({
				title: 'Height',
				description: `Height of the Banner on your ${currentDevice} device (in pixels).`,
				placeholder: 'Enter a number',
				resetValue: defaultSettings.height,
			}, settings, 'height');

			this.addNumber({
				title: 'Padding',
				description: 'Padding of the banner from the edges of the note in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.bannerPadding,
			}, settings, 'bannerPadding');

			this.addNumber({
				title: 'Note offset',
				description: 'Move the position of the notes content in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.noteOffset,
			}, settings, 'noteOffset');

			this.addNumber({
				title: 'View offset',
				description: 'Move the position of the view content in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.viewOffset,
			}, settings, 'viewOffset');


			this.addNumber({
				title: 'Border radius',
				description: 'Size of the border radius in pixels.',
				placeholder: '8',
				isValueArray: true,
				length: 4,
				resetValue: defaultSettings.bannerRadius,
				classes: ['sbs-grid-radius'],
			}, settings, 'bannerRadius');

			this.addToggle({
				title: 'Fade',
				description: 'Fade the image out towards the content.',
				classes: ['sbs-spacer'],
			}, settings, 'bannerFade');
		}
	}

	createFrontmatterSettings() {
		const plugin = this.plugin;
		const settings = plugin.settings;

		this.addHeading('Frontmatter', ['sbs-heading']);
		this.addToggle({
			title: 'Autohide frontmatter/properties',
			description: 'Enable or disables the frontmatter/properties autohide feature.',
		}, settings.properties, 'autohide');

		this.addText({
			title: 'Banner property',
			description: 'Name of the banner property this plugin will look for in the frontmatter.',
			placeholder: 'Default: banner',
			resetValue: DEFAULT_SETTINGS.properties.image,
		}, settings.properties, 'image');

		this.addText({
			title: 'Icon property',
			description: 'Name of the icon property this plugin will look for in the frontmatter.',
			placeholder: 'Default: icon',
			resetValue: DEFAULT_SETTINGS.properties.icon,
		}, settings.properties, 'icon');

		this.addText({
			title: 'Datetime property',
			description: 'Name of the datetime property this plugin will look for in the frontmatter.',
			placeholder: 'Default: datetime',
			resetValue: DEFAULT_SETTINGS.properties.datetime,
			classes: ['sbs-spacer'],
		}, settings.properties, 'datetime');
	}

	createIconSettings() {
		const currentDevice = Settings.currentDevice;
		const settings = this.plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];

		this.addHeading(`Icon`, ['sbs-heading']);
		this.addToggle({
			title: 'Show icon',
			description: 'Enable or disable the icon.',
			refreshOnUpdate: true,
		}, settings, 'iconEnabled');

		if (settings.iconEnabled) {
			this.addNumber({
				title: 'Icon size',
				description: 'Size of the icon in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.iconSize,
			}, settings, 'iconSize');

			this.addToggle({
				title: 'Icon background',
				description: 'Enable or disable the icon background.',
			}, settings, 'iconBackground');

			this.addNumber({
				title: 'Border size',
				description: 'Size of the border in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.iconBorder,
			}, settings, 'iconBorder');

			this.addNumber({
				title: 'Border radius',
				description: 'Size of the border radius in pixels.',
				placeholder: 'Enter a number',
				resetValue: defaultSettings.iconRadius,
			}, settings, 'iconRadius');

			this.addDropdown({
				title: 'Icon alignment - horizontal',
				description: 'Horizontal alignment of the icon.',
				choices: [
					{ label: 'Left', value: 'flex-start' },
					{ label: 'Middle', value: 'center' },
					{ label: 'Right', value: 'flex-end' },
				],
				resetValue: defaultSettings.iconAlignment[0],
			}, settings, 'iconAlignment', 0);

			this.addDropdown({
				title: 'Icon alignment - vertical',
				description: 'Vertical alignment of the icon.',
				choices: [
					{ label: 'Top', value: 'flex-start' },
					{ label: 'Middle', value: 'center' },
					{ label: 'Bottom', value: 'flex-end' },
				],
				resetValue: defaultSettings.iconAlignment[1],
			}, settings, 'iconAlignment', 1);

			this.addNumber({
				title: 'Icon offset',
				description: 'Offset the X and Y position of the icon in pixels',
				placeholder: '0',
				isValueArray: true,
				length: 2,
				resetValue: defaultSettings.iconOffset,
				classes: ['sbs-grid-xy', 'sbs-spacer'],
			}, settings, 'iconOffset');
		}
	}

	createDatetimeSettings() {
		const currentDevice = Settings.currentDevice;
		const settings = this.plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];

		this.addHeading(`Datetime`, ['sbs-heading']);
		this.addToggle({
			title: 'Show datetime',
			description: 'Enable or disable the display of a datetime.',
			refreshOnUpdate: true,
		}, settings, 'datetimeEnabled');

		if (settings.datetimeEnabled) {
			this.addToggle({
				title: 'Only with property',
				description: 'Show datetime only when a property is set in the note',
			}, settings, 'datetimeOnPropOnly');

			this.addText({
				title: 'Time formatting',
				description: sanitizeHTMLToDom('Define how time should be displayed. Leave empty to disable.<br/>Obsidian uses moment.js for formatting. <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">Learn more</a>'),
				placeholder: 'Default: HH:mm:ss',
				allowEmpty: true,
				resetValue: defaultSettings.datetimeTimeFormat,
			}, settings, 'datetimeTimeFormat');

			this.addText({
				title: 'Date formatting',
				description: sanitizeHTMLToDom('Define how the date should be displayed. Leave empty to disable.<br/>Obsidian uses moment.js for formatting. <a href="https://momentjs.com/docs/#/displaying/format/" target="_blank">Learn more</a>'),
				placeholder: 'Default: dddd, MMMM Do YYYY',
				allowEmpty: true,
				resetValue: defaultSettings.datetimeDateFormat,
			}, settings, 'datetimeDateFormat');

			this.addDropdown({
				title: 'Datetime alignment - horizontal',
				description: 'Horizontal alignment of the datetime.',
				choices: [
					{ label: 'Left', value: 'flex-start' },
					{ label: 'Middle', value: 'center' },
					{ label: 'Right', value: 'flex-end' },
				],
				allowEmpty: true,
				resetValue: defaultSettings.datetimeAlignment[0],
			}, settings, 'datetimeAlignment', 0);

			this.addDropdown({
				title: 'Datetime alignment - vertical',
				description: 'Vertical alignment of the datetime.',
				choices: [
					{ label: 'Top', value: 'flex-start' },
					{ label: 'Middle', value: 'center' },
					{ label: 'Bottom', value: 'flex-end' },
				],
				resetValue: defaultSettings.datetimeAlignment[1],
			}, settings, 'datetimeAlignment', 1);

			this.addNumber({
				title: 'Datetime offset',
				description: 'Offset the X and Y position of the datetime in pixels',
				placeholder: '0',
				isValueArray: true,
				length: 2,
				resetValue: defaultSettings.iconOffset,
				classes: ['sbs-grid-xy', 'sbs-spacer'],
			}, settings, 'datetimeOffset');
		}
	}

	/*
	createInteropSettings() {
		const currentDevice = Settings.currentDevice;
		const settings = this.plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];

		this.addHeading(`Plugin interoperability`, ['sbs-heading']);
	}
	*/

	//----------------------------------
	// Helper Methods
	//----------------------------------
	addHeading(text: string, classes?: string[]) {
		const instance = new Setting(this.containerEl).setHeading().setName(text);
		this.setClasses(instance, classes);
	}

	addToggle(options: SettingCompOptions, obj: any, prop: string) {
		const instance = new Setting(this.containerEl);
		if (options.title) {
			instance.setName(options.title);
		}
		if (options.description) {
			instance.setDesc(options.description);
		}

		this.setClasses(instance, options.classes);

		instance.addToggle(component => component
			.setValue(obj[prop])
			.onChange(async (value) => {
				obj[prop] = value;
				await this.plugin.saveSettings();
				if (options.refreshOnUpdate) {
					this.display();
				}
			})
		);
	}

	addDropdown(options: SettingCompOptions, obj: any, prop: string, index?: number) {
		const isResettable = options.resetValue !== undefined;
		const resetValue = options.resetValue;
		const instance = new Setting(this.containerEl);
		const hasIndex = index !== undefined;

		if (options.title) {
			instance.setName(options.title);
		}
		if (options.description) {
			instance.setDesc(options.description);
		}

		this.setClasses(instance, options.classes);

		if (isResettable) {
			instance.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					if (hasIndex) {
						obj[prop][index] = resetValue;
					} else {
						obj[prop] = resetValue;
					}
					await this.plugin.saveSettings();
					this.display();
				})
			)
		}

		instance.addDropdown((dropdown) => {
			const choices = options?.choices || [];
			choices.forEach((choice) => {
				dropdown.addOption(choice.value, choice.label);
			})
			if (hasIndex) {
				dropdown.setValue(obj[prop][index]);
			} else {
				dropdown.setValue(obj[prop]);
			}

			dropdown.onChange(async (v) => {
				if (hasIndex) {
					obj[prop][index] = v;
				} else {
					obj[prop] = v;
				}
				await this.plugin.saveSettings();
			})
			return dropdown;
		})
	}

	addText(options: SettingCompOptions, obj: any, prop: string) {
		const isResettable = options.resetValue !== undefined;
		const resetValue = options.resetValue;
		const instance = new Setting(this.containerEl);

		if (options.title) {
			instance.setName(options.title);
		}
		if (options.description) {
			instance.setDesc(options.description);
		}

		this.setClasses(instance, options.classes);

		if (isResettable) {
			instance.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					obj[prop] = resetValue;
					await this.plugin.saveSettings();
					this.display();
				})
			)
		}

		instance.addText((text) => {
			if (options.placeholder) {
				text.setPlaceholder(options.placeholder);
			}
			text.setValue(obj[prop].toString())
				.onChange(async (value) => {
					if (options.allowEmpty) {
						obj[prop] = value;
					} else {
						obj[prop] = (value !== '') ? value : resetValue || '';

					}
					await this.plugin.saveSettings();
					if (options.refreshOnUpdate) {
						this.display();
					}
				});
			return text;
		});
	}

	addNumber(options: SettingCompOptions, obj: any, prop: string) {
		const asFloat = options.float;
		const isResettable = options.resetValue !== undefined;
		const resetValue = options.resetValue;
		const instance = new Setting(this.containerEl);

		if (options.title) {
			instance.setName(options.title);
		}
		if (options.description) {
			instance.setDesc(options.description);
		}

		this.setClasses(instance, options.classes);

		if (isResettable) {
			instance.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					obj[prop] = (options.isValueArray) ? [...resetValue] : resetValue;
					await this.plugin.saveSettings();
					this.display();
				})
			)
		}

		if (options.isValueArray && options.length !== undefined) {
			const hasPlaceholders = options.placeholders !== undefined;
			for (let i = 0; i < options.length; i++) {
				instance.addText((text) => {
					if (hasPlaceholders && options?.placeholders) {
						text.setPlaceholder(options.placeholders[i] || '');
					} else if (options.placeholder) {
						text.setPlaceholder(options.placeholder);
					}
					text.setValue(obj[prop][i].toString())
						.onChange(async (value) => {
							let num = (asFloat) ? parseFloat(value) : parseInt(value, 10);
							if (isNaN(num) && isResettable) {
								num = resetValue[i] || 0;
							}
							obj[prop][i] = num;
							await this.plugin.saveSettings();
							if (options.refreshOnUpdate) {
								this.display();
							}
						});
					return text;
				});
			}
		} else {
			instance.addText((text) => {
				if (options.placeholder) {
					text.setPlaceholder(options.placeholder);
				}
				text.setValue(obj[prop].toString())
					.onChange(async (value) => {
						let num = (asFloat) ? parseFloat(value) : parseInt(value, 10);
						if (isNaN(num) && isResettable) {
							num = resetValue;
						}
						obj[prop] = num;
						await this.plugin.saveSettings();
						if (options.refreshOnUpdate) {
							this.display();
						}
					});
				return text;
			});
		}
	}

	setClasses(instance: Setting, classes?: Array<string>) {
		if (classes) {
			classes.forEach((c) => instance.setClass(c));
		}
	}
}
