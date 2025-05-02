import SimpleBanner from '../main';
import { DeviceType } from '../types/enums';
import { SimpleBannerSettings } from '../types/interfaces';

export default class SettingsMigrator {
	static async migrate(data: any, plugin: SimpleBanner): Promise<SimpleBannerSettings> {
		const DESKTOP = DeviceType.Desktop;
		const TABLET = DeviceType.Tablet;
		const PHONE = DeviceType.Phone;
		const migrationMap: { [oldKey: string]: { target: string; devices?: string[] } } = {
			desktopHeight: { target: 'desktop.height' },
			tabletHeight: { target: 'tablet.height' },
			mobileHeight: { target: 'phone.height' },
			offset: { target: 'noteOffset', devices: [DESKTOP, TABLET, PHONE] },
			fade: { target: 'bannerFade', devices: [DESKTOP, TABLET, PHONE] },
			radius: { target: 'bannerRadius', devices: [DESKTOP, TABLET, PHONE] },
			padding: { target: 'bannerPadding', devices: [DESKTOP, TABLET, PHONE] },
			propertyName: { target: 'properties.image' },
		};

		let neededMigration = false;
		const newData = { ...data };

		for (const oldKey in migrationMap) {
			if (newData.hasOwnProperty(oldKey) && newData[oldKey] !== undefined) {
				neededMigration = true;
				const migration = migrationMap[oldKey];

				if (migration.devices) {
					migration.devices.forEach((device) => {
						const path = device + '.' + migration.target;
						this.setValueByPath(newData, path, newData[oldKey]);
					});
				} else {
					this.setValueByPath(newData, migration.target, newData[oldKey]);
				}
				delete newData[oldKey];
			}
		}

		if (neededMigration) {
			await plugin.saveData(newData);
		}

		return newData;
	}

	static setValueByPath(obj: any, path: string, value: any) {
		const parts = path.split('.');
		let current = obj;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!current[part] || typeof current[part] !== 'object') {
				current[part] = {};
			}
			current = current[part];
		}
		current[parts[parts.length - 1]] = value;
	}
}
