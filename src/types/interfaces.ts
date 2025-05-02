import { MarkdownView } from 'obsidian';
import { IconType, ViewMode } from './enums';

//----------------------------------
// Plugin Interfaces
//----------------------------------
export interface BannerData {
	filepath: string | null;
	image: string | null;
	icon: string | null,
	datetime: string | null,
	viewMode: ViewMode | null;
	lastViewMode: ViewMode | null;
	isImageChange: boolean;
	isImagePropsUpdate: boolean;
	needsUpdate: boolean;
	view: MarkdownView | null | undefined;
}

export interface ImageOptions {
	url: string,
	external: boolean,
	x: number;
	y: number;
	repeatable: boolean;
}

export interface IconData {
	value: string | null,
	type: IconType,
}

export interface Datastore {
	[key: string]: BannerData;
}

//----------------------------------
// Settings Interfaces
//----------------------------------
export interface SimpleBannerSettings {
	desktop: DeviceSettings
	tablet: DeviceSettings
	phone: DeviceSettings
	properties: PropertySettings;

	[key: string]: any;
}

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

	datetimeEnabled: boolean;
	datetimeOnPropOnly: boolean,
	datetimeAlignment: Array<string>;
	datetimeOffset: Array<number>;
	datetimeTimeFormat: string;
	datetimeDateFormat: string;
}

export interface PropertySettings {
	autohide: boolean;
	image: string;
	icon: string;
	datetime: string;
}

export interface SettingCompOptions {
	title?: string;
	description?: string | DocumentFragment;
	placeholder?: string;
	placeholders?: Array<string>;
	choices?: ValueLabelPair[];
	classes?: Array<string>;
	resettable?: boolean;
	float?: boolean,
	isValueArray?: boolean,
	length?: number,
	resetValue?: any,
	allowEmpty?: boolean,
	refreshOnUpdate?: boolean;
}

export interface ValueLabelPair {
	value: any,
	label: string,
}
