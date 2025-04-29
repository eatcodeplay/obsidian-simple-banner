import { App, PluginSettingTab, Setting } from 'obsidian';
import SimpleBanner from "./main";

//----------------------------------
// Interfaces
//----------------------------------
export interface SimpleBannerSettings {
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

	desktopHeight: number;
	tabletHeight: number;
	mobileHeight: number;

	imageProperty: string;
	iconProperty: string;
}

const DEFAULT_SETTINGS: SimpleBannerSettings = {
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

	desktopHeight: 240,
	mobileHeight: 160,
	tabletHeight: 190,

	imageProperty: 'banner',
	iconProperty: 'icon',
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
		const settings = plugin.settings;

		new Setting(containerEl)
			.setHeading()
			.setName('Banner Settings');

		new Setting(containerEl)
			.setName('Note Offset')
			.setDesc('Move the position of the notes content in pixels.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.noteOffset = DEFAULT_SETTINGS.noteOffset;
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
						num = DEFAULT_SETTINGS.noteOffset;
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
					settings.bannerRadius = DEFAULT_SETTINGS.bannerRadius;
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
						num = DEFAULT_SETTINGS.bannerRadius[0];
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
						num = DEFAULT_SETTINGS.bannerRadius[1];
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
						num = DEFAULT_SETTINGS.bannerRadius[2];
					}
					settings.bannerRadius[2] = num;
					await plugin.saveSettings();
				})
			)
			.addText((text) => {
				text.setPlaceholder('8')
					.setValue(settings.bannerRadius[3].toString())
					.onChange(async (value) => {
						let num = parseInt(value, 10);
						if (isNaN(num)) {
							num = DEFAULT_SETTINGS.bannerRadius[3];
						}
						settings.bannerRadius[3] = num;
						await plugin.saveSettings();
					});
				text?.inputEl?.parentElement?.classList.add('smpbn-banner-radii');
				return text;
			});

		new Setting(containerEl)
			.setName('Padding')
			.setDesc('Padding of the banner from the edges of the note in pixels.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.bannerPadding = DEFAULT_SETTINGS.bannerPadding;
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
						num = DEFAULT_SETTINGS.bannerPadding;
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
			.setName('Height - Desktop')
			.setDesc('Height of the Banner on desktop devices (in pixels).')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.desktopHeight = DEFAULT_SETTINGS.desktopHeight;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(settings.desktopHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.desktopHeight;
					}
					settings.desktopHeight = num;
					await plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Height - Tablet')
			.setDesc('Height of the Banner on tablet devices (in pixels).')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.tabletHeight = DEFAULT_SETTINGS.tabletHeight;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(settings.tabletHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.tabletHeight;
					}
					settings.tabletHeight = num;
					await plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Height - Mobile')
			.setDesc('Height of the Banner on mobile devices (in pixels).')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.mobileHeight = DEFAULT_SETTINGS.mobileHeight;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Enter a number')
				.setValue(settings.mobileHeight.toString())
				.onChange(async (value) => {
					let num = parseInt(value, 10);
					if (isNaN(num)) {
						num = DEFAULT_SETTINGS.mobileHeight;
					}
					settings.mobileHeight = num;
					await plugin.saveSettings();
				})
			);
	}

	createIconSettings(containerEl: HTMLElement) {
		const plugin = this.plugin;
		const settings = plugin.settings;

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
						settings.iconSize = DEFAULT_SETTINGS.iconSize;
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
							num = DEFAULT_SETTINGS.iconSize;
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
						settings.iconRadius = DEFAULT_SETTINGS.iconRadius;
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
							num = DEFAULT_SETTINGS.iconRadius;
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

			if (settings.iconBackground) {
				new Setting(containerEl)
					.setName('Icon Border Size')
					.setDesc('Size of the border in pixels.')
					.addExtraButton(button => button
						.setIcon(ICON_RESET)
						.setTooltip(TEXT_RESET)
						.onClick(async () => {
							settings.iconBorder = DEFAULT_SETTINGS.iconBorder;
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
								num = DEFAULT_SETTINGS.iconBorder;
							}
							settings.iconBorder = num;
							await plugin.saveSettings();
						})
					);
			}

			new Setting(containerEl)
				.setName('Icon Alignment - Horizontal')
				.setDesc('Horizontal alignment of the icon.')
				.addExtraButton(button => button
					.setIcon(ICON_RESET)
					.setTooltip(TEXT_RESET)
					.onClick(async () => {
						settings.iconAlignment[0] = DEFAULT_SETTINGS.iconAlignment[0];
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
						settings.iconAlignment[1] = DEFAULT_SETTINGS.iconAlignment[1];
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
						settings.iconOffset = DEFAULT_SETTINGS.iconOffset;
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
							num = DEFAULT_SETTINGS.iconOffset[0];
						}
						settings.iconOffset[0] = num;
						await plugin.saveSettings();
					})
				)
				.addText((text) => {
					text.setPlaceholder('8')
						.setValue(settings.iconOffset[1].toString())
						.onChange(async (value) => {
							let num = parseInt(value, 10);
							if (isNaN(num)) {
								num = DEFAULT_SETTINGS.iconOffset[1];
							}
							settings.iconOffset[1] = num;
							await plugin.saveSettings();
						});
					text?.inputEl?.parentElement?.classList.add('smpbn-banner-offset');
					return text;
				});

		}
	}

	createFrontmatterSettings(containerEl: HTMLElement) {
		const plugin = this.plugin;
		const settings = plugin.settings;

		new Setting(containerEl)
			.setHeading()
			.setName('Frontmatter Settings');

		new Setting(containerEl)
			.setName('Image/Banner Property')
			.setDesc('Name of the image/banner property this plugin should look for in the frontmatter.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.imageProperty = DEFAULT_SETTINGS.imageProperty;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Default: banner')
				.setValue(settings.imageProperty.toString())
				.onChange(async (value) => {
					settings.imageProperty = (value !== '') ? value : DEFAULT_SETTINGS.imageProperty;
					await plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Icon Property')
			.setDesc('Name of the icon property this plugin should look for in the frontmatter.')
			.addExtraButton(button => button
				.setIcon(ICON_RESET)
				.setTooltip(TEXT_RESET)
				.onClick(async () => {
					settings.iconProperty = DEFAULT_SETTINGS.iconProperty;
					await plugin.saveSettings();
					this.display();
				})
			)
			.addText(text => text
				.setPlaceholder('Default: icon')
				.setValue(settings.iconProperty.toString())
				.onChange(async (value) => {
					settings.iconProperty = (value !== '') ? value : DEFAULT_SETTINGS.iconProperty;
					await plugin.saveSettings();
				})
			);
	}
}
