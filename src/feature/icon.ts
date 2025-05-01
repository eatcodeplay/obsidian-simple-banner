import { Platform } from 'obsidian';
import { BannerData, DeviceSettings } from '../types/interfaces';
import { CSSClasses, IconType } from '../types/enums';
import DomUtils from '../utils/domutils';
import Parse from '../utils/parse';

export default class Icon {
	static update(data: BannerData, banners: HTMLElement[], settings: DeviceSettings) {
		let calculatedFontSize: string | null = null;
		banners.forEach((banner) => {
			const { icon, view } = data;
			let iconContainer = banner.querySelector(`.${CSSClasses.Icon}`) || null;
			const hadIconContainer = iconContainer !== null;
			if (hadIconContainer) {
				iconContainer?.classList.add(CSSClasses.Static);
			}
			if (settings.iconEnabled && icon) {
				if (!hadIconContainer) {
					iconContainer = document.createElement('div');
					iconContainer.classList.add(CSSClasses.Icon);
					if (Platform.isWin) {
						iconContainer.classList.add(CSSClasses.IsWindows);
					}
					const div = document.createElement('div');
					iconContainer.appendChild(div);
					banner.prepend(iconContainer);
				}

				if (iconContainer) {
					const iconelement = iconContainer.querySelector('div') as HTMLElement;

					let { value, type } = Parse.icon(icon, view);
					value = value?.replace(/([#.:[\\]"])/g, '\\$1') || '';
					iconelement.dataset.type = type;

					const iconVars = {} as any;
					iconVars['icon-value'] = type === IconType.Link ? `url(${value})` : `"${value}"`;

					if (type === IconType.Text) {
						calculatedFontSize = calculatedFontSize ? calculatedFontSize : DomUtils.calculateFontsize(value);
						iconVars['icon-fontsize'] = calculatedFontSize;
					}
					DomUtils.setCSSVariables(iconVars, iconelement);
				}
			} else if (iconContainer) {
				data.icon = null;
				iconContainer.remove();
			}
		});
	}
}
