import { BannerData, ImageOptions } from '../types/interfaces';
import { CSSClasses, CSSValue } from '../types/enums';
import DomUtils from '../utils/domutils';

const MAIN_SELECTOR = `.${CSSClasses.Main}`;

export default class Banner {
	static update(data: BannerData, imgOptions: ImageOptions, containers: NodeListOf<HTMLElement>): HTMLElement[] {
		const { isImageChange, isImagePropsUpdate } = data;
		const banners: HTMLElement[] = [];

		containers.forEach(container => {
			let element = (container.querySelector(MAIN_SELECTOR) || document.createElement('div')) as HTMLElement;
			element.classList.add(CSSClasses.Main);
			banners.push(element);

			if (isImageChange || isImagePropsUpdate) {
				if (isImageChange) {
					element.classList.remove(CSSClasses.Static);
				}

				DomUtils.setCSSVariables({
					'url': `url(${imgOptions.url})`,
					'img-x': `${imgOptions.x}px`,
					'img-y': `${imgOptions.y}px`,
					'size': imgOptions.repeatable ? CSSValue.Auto : CSSValue.RevertLayer,
					'repeat': imgOptions.repeatable ? CSSValue.Repeat : CSSValue.RevertLayer,
				}, container);
			}
		});
		return banners;
	}

	static insert(banners: HTMLElement[], containers: NodeListOf<HTMLElement>): void {
		containers.forEach((container, index) => {
			const banner: HTMLElement = banners[index];
			container.prepend(banner);
			banner.onanimationend = () => {
				const instances = document.querySelectorAll(MAIN_SELECTOR);
				instances.forEach(i => i.classList.add(CSSClasses.Static));
			}
		});
	}

	static replace(banners: HTMLElement[]): void {
		banners.forEach((banner) => {
			banner.classList.add(CSSClasses.Static);
		})
	}
}
