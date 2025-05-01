import SimpleBanner from '../main';

let instance: SimpleBanner;
export default class DomUtils {
	static init(plugin: SimpleBanner) {
		instance = plugin;
	}
	static calculateFontsize(textContent: string) {
		const temp = document.createElement('span');
		temp.setAttribute('style', 'position: absolute; visibility: hidden; white-space: nowrap;');
		temp.style.padding = '0';
		temp.style.margin = '0';
		temp.style.left = '-9999px';
		temp.textContent = textContent.toUpperCase();
		document.body.appendChild(temp);
		const size = instance.deviceSettings.iconSize;
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

	static setCSSVariables(variables: Record<string, string>, target: HTMLElement = document.body) {
		const style = target.style;
		Object.keys(variables).forEach(k => {
			style.setProperty(`--sb-${k}`, variables[k]);
		});
	}
}
