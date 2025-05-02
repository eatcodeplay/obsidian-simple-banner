import { BannerData, DeviceSettings } from '../types/interfaces';
import { moment } from 'obsidian';
import SimpleBanner from '../main';
import { FeatureBase } from './base';
import { CSSClasses } from '../types/enums';

const CONTAINER_SELECTOR = `.${CSSClasses.Main} > div.${CSSClasses.Datetime}`;

export default class Datetime extends FeatureBase {
	//----------------------------------
	// Variables
	//----------------------------------
	private time: string | undefined;
	private date: string | undefined;
	private iso: string | undefined;
	private intervalId: number | undefined;

	//----------------------------------
	// Constructor
	//----------------------------------
	constructor(plugin: SimpleBanner, settings: DeviceSettings) {
		super(plugin, settings);
		this.processTime();
	}

	//----------------------------------
	// Lifecycle
	//----------------------------------
	destroy() {
		window.clearInterval(this.intervalId);
	}

	//----------------------------------
	// Methods
	//----------------------------------
	update(data: BannerData, banners: HTMLElement[]) {
		const { datetimeEnabled, datetimeOnPropOnly } = this.settings;
		const { datetime } = data;

		if (datetimeEnabled) {
			banners.forEach((banner) => {
				let container = banner.querySelector(`.${CSSClasses.Datetime}`) || null;
				const hasContainer = container !== null;
				if (hasContainer) {
					container?.classList.add(CSSClasses.Static);
				}
				if ((datetimeEnabled && !datetimeOnPropOnly) || (datetimeEnabled && datetimeOnPropOnly && datetime)) {
					if (!hasContainer) {
						container = document.createElement('div');
						container.classList.add(CSSClasses.Datetime);
						const div = document.createElement('time');
						container.appendChild(div);
						banner.prepend(container);
					}

					const dtElement = container?.querySelector('time') as HTMLElement;
					dtElement.classList.remove(CSSClasses.Static);
					if (datetime) {
						dtElement.classList.add(CSSClasses.Static);
						this.updateTime([dtElement], datetime, true);
					} else if (!datetimeOnPropOnly) {
						this.updateTime([dtElement]);
					}
				} else if (hasContainer) {
					container?.remove();
				}
			});
		} else {
			const datetimes = document.querySelectorAll(CONTAINER_SELECTOR);
			datetimes.forEach((dt) => {
				dt.remove();
			});
		}
	}

	check() {
		const currentInterval = this.intervalId;
		const { datetimeEnabled, datetimeOnPropOnly } = this.settings;
		if (datetimeEnabled && !datetimeOnPropOnly) {
			const numTimes = document.querySelectorAll(CONTAINER_SELECTOR).length;
			if (numTimes === 0 && currentInterval !== undefined) {
				window.clearInterval(this.intervalId);
				this.intervalId = undefined;
			} else if (numTimes > 0 && currentInterval === undefined) {
				this.intervalId = window.setInterval(() => this.processTime(), 1000);
			}
		}
	}

	//----------------------------------
	// Private Methods
	//----------------------------------
	private processTime() {
		const { datetimeEnabled, datetimeOnPropOnly, datetimeTimeFormat, datetimeDateFormat } = this.settings;
		const showTime = datetimeTimeFormat !== '';
		const showDate = datetimeDateFormat !== '';
		if (datetimeEnabled && !datetimeOnPropOnly) {
			const now = moment();
			this.time = showTime ? now.format(datetimeTimeFormat) : '';
			this.date = showDate ? now.format(datetimeDateFormat) : '';
			this.iso = now.toISOString();
			this.updateTime();
		}
	}

	private updateTime(elements?: HTMLElement[], datetime?: string | null, forceUpdate?: boolean) {
		const { datetimeEnabled, datetimeTimeFormat, datetimeDateFormat } = this.settings;
		const showTime = datetimeTimeFormat !== '';
		const showDate = datetimeDateFormat !== '';
		if (datetimeEnabled) {
			let { time, date, iso } = this;
			if (datetime) {
				const dt = moment(datetime);
				time = showTime ? dt.format(datetimeTimeFormat) : '';
				date = showDate ? dt.format(datetimeDateFormat) : '';
				const hasTimeInfo = datetime.includes('T');
				if (!hasTimeInfo) {
					time = '';
				}
				iso = dt.toISOString();
			}

			const els = elements || document.querySelectorAll(`${CONTAINER_SELECTOR} > time`);
			if (els.length > 0) {
				els.forEach((el) => {
					const create = el.children?.length === 0;
					if (create) {
						el.createEl('span', { text: time });
						el.createEl('span', { text: date });
					} else {
						if (!el.classList.contains(CSSClasses.Static) || forceUpdate) {
							const spans = el.querySelectorAll('span');
							const values = [time, date];
							spans.forEach((span, index) => {
								span.textContent = values[index] || '';
							});
						}
					}
					el.setAttribute('datetime', iso || '');
				});
			}
		}
	}
}
