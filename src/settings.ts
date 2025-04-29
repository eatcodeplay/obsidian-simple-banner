import {App, Platform, PluginSettingTab, Setting} from 'obsidian';
import SimpleBanner from "./main";

//----------------------------------
// Interfaces
//----------------------------------
export interface DeviceSettings {
	bannerEnabled: boolean;
	height: number;
	noteOffset: number;
	bannerRadius: Array<number>;
	bannerPadding: number;
	bannerFade: boolean;

	iconEnabled: boolean,
	iconSize: number;
	iconRadius: number;
	iconBackground: boolean;
	iconBorder: number;
	iconAlignment: Array<string>;
	iconOffset: Array<number>;
}

export interface PropertySettings {
	autohide: boolean;
	image: string;
	icon: string;
}

export interface SimpleBannerSettings {
	desktop: DeviceSettings
	tablet: DeviceSettings
	phone: DeviceSettings
	properties: PropertySettings;
}

export enum DeviceType {
	Desktop = 'desktop',
	Tablet = 'tablet',
	Phone = 'phone',
}

const DEFAULT_SETTINGS: SimpleBannerSettings = {
	desktop: {
		bannerEnabled: true,
		height: 240,
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
	},

	tablet: {
		bannerEnabled: true,
		height: 190,
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
	},

	phone: {
		bannerEnabled: true,
		height: 160,
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
	},

	properties: {
		autohide: true,
		image: 'banner',
		icon: 'icon',
	},
}
const ICON_RESET = 'rotate-ccw';
const TEXT_RESET = 'Restore default';

/**
 * Represents the settings tab for configuring the SimpleBanner plugin.
 *
 */
export class Settings extends PluginSettingTab {
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

	static get DEFAULT_SETTINGS(): SimpleBannerSettings {
		return DEFAULT_SETTINGS;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		this.createBannerSettings(containerEl);
		this.createIconSettings(containerEl);
		this.createFrontmatterSettings(containerEl);
	}

	createBannerSettings(containerEl: HTMLElement) {
		const plugin = this.plugin;
		const currentDevice = Settings.currentDevice;
		const settings = plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];
		const prettyDevice = currentDevice.charAt(0).toUpperCase() + currentDevice.slice(1);

		new Setting(containerEl)
			.setHeading()
			.setName(`Simple Banner - ${prettyDevice} Settings`)

		new Setting(containerEl)
			.setName('Show Simple Banner')
			.setDesc(`Enable or disable Simple Banner on your ${currentDevice} device.`)
			.addToggle(component => component
				.setValue(settings.bannerEnabled)
				.onChange(async (value) => {
					settings.bannerEnabled = value;
					await plugin.saveSettings();
					this.display();
				}));

		if (settings.bannerEnabled) {
			new Setting(containerEl)
				.setName('Note Offset')
				.setDesc('Move the position of the notes content in pixels.')
				.addExtraButton(button => button
					.setIcon(ICON_RESET)
					.setTooltip(TEXT_RESET)
					.onClick(async () => {
						settings.noteOffset = defaultSettings.noteOffset;
						await plugin.saveSettings();
						this.display();
					})
				)
				.addText(text => text
					.setPlaceholder('Enter a number')
					.setValue(settings.noteOffset.toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.noteOffset;
						}
						settings.noteOffset = num;
						await plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName('Border Radius')
				.setDesc('Size of the border radius in pixels.')
				.addExtraButton(button => button
					.setIcon(ICON_RESET)
					.setTooltip(TEXT_RESET)
					.onClick(async () => {
						settings.bannerRadius = defaultSettings.bannerRadius;
						await plugin.saveSettings();
						this.display();
					})
				)
				.addText(text => text
					.setPlaceholder('8')
					.setValue(settings.bannerRadius[0].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.bannerRadius[0];
						}
						settings.bannerRadius[0] = num;
						await plugin.saveSettings();
					})
				)
				.addText(text => text
					.setPlaceholder('8')
					.setValue(settings.bannerRadius[1].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.bannerRadius[1];
						}
						settings.bannerRadius[1] = num;
						await plugin.saveSettings();
					})
				)
				.addText(text => text
					.setPlaceholder('8')
					.setValue(settings.bannerRadius[2].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.bannerRadius[2];
						}
						settings.bannerRadius[2] = num;
						await plugin.saveSettings();
					})
				)
				.addText(text => text
					.setPlaceholder('8')
					.setValue(settings.bannerRadius[3].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.bannerRadius[3];
						}
						settings.bannerRadius[3] = num;
						await plugin.saveSettings();
					})
				)
				.setClass('smpbn-banner-radii');

			new Setting(containerEl)
				.setName('Padding')
				.setDesc('Padding of the banner from the edges of the note in pixels.')
				.addExtraButton(button => button
					.setIcon(ICON_RESET)
					.setTooltip(TEXT_RESET)
					.onClick(async () => {
						settings.bannerPadding = defaultSettings.bannerPadding;
						await plugin.saveSettings();
						this.display();
					})
				)
				.addText(text => text
					.setPlaceholder('Enter a number')
					.setValue(settings.bannerPadding.toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.bannerPadding;
						}
						settings.bannerPadding = num;
						await plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName('Fade')
				.setDesc('Fade the image out towards the content.')
				.addToggle(component => component
					.setValue(settings.bannerFade)
					.onChange(async (value) => {
						settings.bannerFade = value;
						await plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Height')
				.setDesc(`Height of the Banner on your ${currentDevice} device (in pixels).`)
				.addExtraButton(button => button
					.setIcon(ICON_RESET)
					.setTooltip(TEXT_RESET)
					.onClick(async () => {
						settings.height = defaultSettings.height;
						await plugin.saveSettings();
						this.display();
					})
				)
				.addText(text => text
					.setPlaceholder('Enter a number')
					.setValue(settings.height.toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = defaultSettings.height;
						}
						settings.height = num;
						await plugin.saveSettings();
					})
				);
		}
	}

	createIconSettings(containerEl: HTMLElement) {
		const plugin = this.plugin;
		const currentDevice = Settings.currentDevice;
		const settings = plugin.settings[currentDevice];
		const defaultSettings = DEFAULT_SETTINGS[currentDevice];

		if (settings.bannerEnabled) {
			new Setting(containerEl)
				.setHeading()
				.setName('Icon Settings');

			new Setting(containerEl)
				.setName('Show Icon')
				.setDesc('Enable or disable the icon.')
				.addToggle(component => component
					.setValue(settings.iconEnabled)
					.onChange(async (value) => {
						settings.iconEnabled = value;
						await plugin.saveSettings();
						this.display();
					}));

			if (settings.iconEnabled) {
				new Setting(containerEl)
					.setName('Icon Size')
					.setDesc('Size of the icon in pixels.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconSize = defaultSettings.iconSize;
							await plugin.saveSettings();
							this.display();
						})
					)
					.addText(text => text
						.setPlaceholder('Enter a number')
						.setValue(settings.iconSize.toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = defaultSettings.iconSize;
							}
							settings.iconSize = num;
							await plugin.saveSettings();
						})
					);

				new Setting(containerEl)
					.setName('Border Radius')
					.setDesc('Size of the border radius in pixels.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconRadius = defaultSettings.iconRadius;
							await plugin.saveSettings();
							this.display();
						})
					)
					.addText(text => text
						.setPlaceholder('Enter a number')
						.setValue(settings.iconRadius.toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = defaultSettings.iconRadius;
							}
							settings.iconRadius = num;
							await plugin.saveSettings();
						})
					);

				new Setting(containerEl)
					.setName('Icon Background')
					.setDesc('Enable or disable the icon background.')
					.addToggle(component => component
						.setValue(settings.iconBackground)
						.onChange(async (value) => {
							settings.iconBackground = value;
							await plugin.saveSettings();
							this.display();
						}));

				new Setting(containerEl)
					.setName('Icon Border Size')
					.setDesc('Size of the border in pixels.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconBorder = defaultSettings.iconBorder;
							await plugin.saveSettings();
							this.display();
						})
					)
					.addText(text => text
						.setPlaceholder('Enter a number')
						.setValue(settings.iconBorder.toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = defaultSettings.iconBorder;
							}
							settings.iconBorder = num;
							await plugin.saveSettings();
						})
					);

				new Setting(containerEl)
					.setName('Icon Alignment - Horizontal')
					.setDesc('Horizontal alignment of the icon.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconAlignment[0] = defaultSettings.iconAlignment[0];
							await plugin.saveSettings();
							this.display();
						})
					)
					.addDropdown(dropdown => {
						dropdown.addOption('flex-start', 'Left');
						dropdown.addOption('center', 'Middle');
						dropdown.addOption('flex-end', 'Right');
						dropdown.setValue(settings.iconAlignment[0]);
						dropdown.onChange(async (value) => {
							settings.iconAlignment[0] = value;
							await plugin.saveSettings();
						})
					})

				new Setting(containerEl)
					.setName('Icon Alignment - Vertical')
					.setDesc('Vertical alignment of the icon.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconAlignment[1] = defaultSettings.iconAlignment[1];
							await plugin.saveSettings();
							this.display();
						})
					)
					.addDropdown(dropdown => {
						dropdown.addOption('flex-start', 'Top');
						dropdown.addOption('center', 'Middle');
						dropdown.addOption('flex-end', 'Bottom');
						dropdown.setValue(settings.iconAlignment[1]);
						dropdown.onChange(async (value) => {
							settings.iconAlignment[1] = value;
							await plugin.saveSettings();
						})
					})

				new Setting(containerEl)
					.setName('Icon Offset')
					.setDesc('Offset the X and Y position of the icon in pixels')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconOffset = defaultSettings.iconOffset;
							await plugin.saveSettings();
							this.display();
						})
					)
					.addText(text => text
						.setPlaceholder('8')
						.setValue(settings.iconOffset[0].toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = defaultSettings.iconOffset[0];
							}
							settings.iconOffset[0] = num;
							await plugin.saveSettings();
						})
					)
					.addText(text => text
						.setPlaceholder('8')
						.setValue(settings.iconOffset[1].toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = defaultSettings.iconOffset[1];
							}
							settings.iconOffset[1] = num;
							await plugin.saveSettings();
						})
					)
					.setClass('smpbn-banner-offset');
			}
		}
	}

	createFrontmatterSettings(containerEl: HTMLElement) {
		const plugin = this.plugin;
		const settings = plugin.settings;

		new Setting(containerEl)
			.setHeading()
			.setName('Frontmatter Settings (Global)');

		new Setting(containerEl)
			.setName('Autohide Frontmatter/Properties')
			.setDesc(`Enable or disables the frontmatter/properties autohide feature.`)
			.addToggle(component => component
				.setValue(settings.properties.autohide)
				.onChange(async (value) => {
					settings.properties.autohide = value;
					await plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Banner Property')
			.setDesc('Name of the banner property this plugin will look for in the frontmatter.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.properties.image = DEFAULT_SETTINGS.properties.image;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Default: banner')
				.setValue(settings.properties.image.toString())
				.onChange(async (value) => {
					settings.properties.image = (value !== '') ? value : DEFAULT_SETTINGS.properties.image;
					await plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Icon Property')
			.setDesc('Name of the icon property this plugin will look for in the frontmatter.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.properties.icon = DEFAULT_SETTINGS.properties.icon;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Default: icon')
				.setValue(settings.properties.icon.toString())
				.onChange(async (value) => {
					settings.properties.icon = (value !== '') ? value : DEFAULT_SETTINGS.properties.icon;
					await plugin.saveSettings();
				})
			);
	}
}

export class SettingsMigrator {
	static async migrate(data: any, plugin: SimpleBanner): Promise<SimpleBannerSettings> {
		const DESKTOP = DeviceType.Desktop;
		const TABLET = DeviceType.Tablet;
		const PHONE = DeviceType.Phone;
		const migrationMap: { [oldKey: string]: { target: string; devices?: string[] } } = {
			desktopHeight: { target: 'desktop.height' },
			tabletHeight: { target: 'tablet.height' },
			mobileHeight: { target: 'phone.height' },
			offset: { target: 'noteOffset', devices: [DESKTOP, TABLET, PHONE] },
			fade: { target: 'bannerFade', devices: [DESKTOP, TABLET, PHONE] },
			radius: { target: 'bannerRadius', devices: [DESKTOP, TABLET, PHONE] },
			padding: { target: 'bannerPadding', devices: [DESKTOP, TABLET, PHONE] },
			propertyName: { target: 'properties.image' },
		};

		let neededMigration = false;
		const newData = { ...data };

		for (const oldKey in migrationMap) {
			if (newData.hasOwnProperty(oldKey) && newData[oldKey] !== undefined) {
				neededMigration = true;
				const migration = migrationMap[oldKey];

				if (migration.devices) {
					migration.devices.forEach((device) => {
						const path = device + '.' + migration.target;
						this.setValueByPath(newData, path, newData[oldKey]);
					});
				} else {
					this.setValueByPath(newData, migration.target, newData[oldKey]);
				}
				delete newData[oldKey];
			}
		}

		if (neededMigration) {
			console.log('migrated settings');
			await plugin.saveData(newData);
		}

		return newData;
	}

	static setValueByPath(obj: any, path: string, value: any) {
		const parts = path.split('.');
		let current = obj;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!current[part] || typeof current[part] !== 'object') {
				current[part] = {};
			}
			current = current[part];
		}
		current[parts[parts.length - 1]] = value;
	}
}
