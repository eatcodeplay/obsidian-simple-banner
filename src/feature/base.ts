import { BannerData, DeviceSettings } from '../types/interfaces';
import SimpleBanner from '../main';

/**
 * @interface FeatureInterface
 * Defines the contract that all features within the plugin must implement.
 */
export interface FeatureInterface {
    destroy(): void;

    update(data: BannerData, ...args: any[]): any;
}

/**
 * @abstract
 * @class FeatureBase
 * An abstract base class that all features in the plugin should extend.
 * It provides common functionality and enforces the implementation of the
 * FeatureInterface.
 */
export abstract class FeatureBase implements FeatureInterface {
    protected plugin: SimpleBanner;
    protected settings: DeviceSettings;

    constructor(plugin: SimpleBanner, settings: DeviceSettings) {
        this.plugin = plugin;
        this.settings = settings;
    }

    abstract destroy(): void;

    abstract update(data: BannerData, ...args: any[]): any;
}
