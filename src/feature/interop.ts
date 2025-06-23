import { BannerData, DeviceSettings } from '../types/interfaces';
import SimpleBanner from '../main';
import { FeatureBase } from './base';

export default class PluginInterOp extends FeatureBase {
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
	update(data: BannerData, banners: HTMLElement[]) {
		/*
		const viewContainer =data?.view?.containerEl;
		const interop = this.settings.interop;
		*/
	}

	check() {
	}

	//----------------------------------
	// Private Methods
	//----------------------------------
}
