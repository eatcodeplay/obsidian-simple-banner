import { Platform } from 'obsidian';
import { BannerData, DeviceSettings } from '../types/interfaces';
import { CSSClasses, IconType } from '../types/enums';
import { FeatureBase } from './base';
import DomUtils from '../utils/domutils';
import Parse from '../utils/parse';
import SimpleBanner from '../main';

export default class Icon extends FeatureBase {
	//----------------------------------
	// Variables
	//----------------------------------

	//----------------------------------
	// Constructor
	//----------------------------------
	constructor(plugin: SimpleBanner, settings: DeviceSettings) {
		super(plugin, settings);
	}

	//----------------------------------
	// Lifecycle
	//----------------------------------
	destroy() {
	}

	//----------------------------------
	// Methods
	//----------------------------------
	async update(data: BannerData, banners: HTMLElement[]) {
		const { iconEnabled, iconSize } = this.settings;
		let calculatedFontSize: string | null = null;

		for (let i = 0, n = banners.length; i < n; i += 1) {
			const banner = banners[i];
			const { icon, view } = data;
			let container = banner.querySelector(`.${CSSClasses.Icon}`) || null;
			const hasContainer = container !== null;
			if (hasContainer) {
				container?.classList.add(CSSClasses.Static);
			}
			if (iconEnabled && icon) {
				if (!hasContainer) {
					container = document.createElement('div');
					container.classList.add(CSSClasses.Icon);
					if (Platform.isWin) {
						container.classList.add(CSSClasses.IsWindows);
					}
					const div = document.createElement('div');
					container.appendChild(div);
					banner.prepend(container);
				}

				const iconElement = container?.querySelector('div') as HTMLElement;
				let { value, type } = await Parse.icon(icon, view);

				value = value?.replace(/([#.:[\\]"])/g, '\\$1') || '';
				iconElement.dataset.type = type;

				const vars = {} as any;
				vars['icon-value'] = type === IconType.Link ? `url(${value})` : `"${value}"`;

				if (type === IconType.Text) {
					calculatedFontSize = calculatedFontSize ? calculatedFontSize : DomUtils.calculateFontsize(value, iconSize);
					vars['icon-fontsize'] = calculatedFontSize;
				}
				DomUtils.setCSSVariables(vars, iconElement);
			} else if (hasContainer) {
				data.icon = null;
				container?.remove();
			}
		}
	}
}
