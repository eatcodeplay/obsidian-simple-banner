import { BannerData, DeviceSettings, ImageOptions } from '../types/interfaces';
import { ContentType, CSSClasses, CSSValue } from '../types/enums';
import DomUtils from '../utils/domutils';
import SimpleBanner from '../main';
import { FeatureBase } from './base';

const MAIN_SELECTOR = `.${CSSClasses.Main}`;

export default class Banner extends FeatureBase {
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
	update(data: BannerData, imgOptions: ImageOptions, containers: NodeListOf<HTMLElement>): HTMLElement[] {
		const { isImageChange, isImagePropsUpdate } = data;
		const banners: HTMLElement[] = [];

		containers.forEach(container => {
			let element = (container.querySelector(MAIN_SELECTOR) || document.createElement('div')) as HTMLElement;
			element.classList.add(CSSClasses.Main);
			banners.push(element);

			if (isImageChange || isImagePropsUpdate) {
				if (isImageChange) {
					element.classList.remove(CSSClasses.Static);
					element.firstChild?.remove();
				}

				const vars =  {
					'img-x': `${imgOptions.x}px`,
					'img-y': `${imgOptions.y}px`,
					'size': imgOptions.repeatable ? CSSValue.Auto : CSSValue.RevertLayer,
					'repeat': imgOptions.repeatable ? CSSValue.Repeat : CSSValue.RevertLayer,
					'url': 'none',
				};

				if (imgOptions.type === ContentType.Video) {
					const video = document.createElement('video');
					video.controls = false;
					video.autoplay = true;
					video.muted = true;
					video.loop = true;
					video.src = imgOptions.url;
					element.appendChild(video);
					vars.url = 'none';
				} else {
					vars.url = `url(${imgOptions.url})`;
				}

				DomUtils.setCSSVariables(vars, container);
			}
		});
		return banners;
	}

	inject(banners: HTMLElement[], containers: NodeListOf<HTMLElement>): void {
		containers.forEach((container, index) => {
			const banner: HTMLElement = banners[index];
			container.prepend(banner);
			banner.onanimationend = () => {
				const instances = document.querySelectorAll(MAIN_SELECTOR);
				instances.forEach(i => i.classList.add(CSSClasses.Static));
			}
		});
	}

	replace(banners: HTMLElement[]): void {
		banners.forEach((banner) => {
			banner.classList.add(CSSClasses.Static);
		})
	}
}
