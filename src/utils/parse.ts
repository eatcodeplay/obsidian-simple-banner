import { MarkdownView } from 'obsidian';
import SimpleBanner from '../main';
import { IconData, ImageOptions } from '../types/interfaces';
import { IconType } from '../types/enums';

let instance: SimpleBanner;
const RegExpression = {
	Wikilink: /^!?\[\[([^\]]+?)(\|([^\]]+?))?\]\]$/,
	Markdown: /^!?\[([^\]]*)\]\(([^)]+?)\)$/,
	MarkdownBare: /^!?<([^>]+)>$/,
	Weblink: /^https?:\/\//i,
};

export default class Parse {

	static init(plugin: SimpleBanner) {
		instance = plugin;
	}

	static link(str: string, view?: MarkdownView | null, settingProperty?: string | null): ImageOptions {
		let url: string | null = null;
		let displayText: string | null = null;
		let external: boolean;
		let obsidianUrl: boolean = false;
		let options = { x: 0, y: 0, repeatable: false };

		const wikilinkMatch = str.match(RegExpression.Wikilink);
		if (wikilinkMatch) {
			url = wikilinkMatch[1].trim();
			displayText = wikilinkMatch[3] ? wikilinkMatch[3].trim() : null;
		}

		const markdownMatch = str.match(RegExpression.Markdown);
		const markdownBareMatch = str.match(RegExpression.MarkdownBare);
		if (markdownMatch) {
			displayText = markdownMatch[1].trim();
			url = markdownMatch[2].trim();
		} else if (markdownBareMatch) {
			url = markdownBareMatch[1].trim();
			displayText = null;
		}

		if (!url) {
			url = str;
			displayText = null;
		}

		external = RegExpression.Weblink.test(url);

		if (this.isObsidianUrl(url)) {
			const str = url.replace('obsidian://open', '');
			const params = new URLSearchParams(str);
			let file = params.get('file');
			if (file) {
				url = file;
				obsidianUrl = true;
				external = false;
				displayText = null;
			}
		}

		const hashIndex = url.indexOf('#');
		if ((external || obsidianUrl) && hashIndex !== -1) {
			options = this.imageProperties(url.substring(hashIndex + 1));
			url = url.replace(/#.*/, '').trim();
		}

		if (displayText) {
			options = this.imageProperties(displayText);
		}

		if (!external) {
			const vault = instance.app.vault;
			const files = vault.getFiles().filter(f => f.path === url || f.name === url);
			let file = files.find(f => f.path === url);
			if (file) {
				url = vault.getResourcePath(file);
			}
			if (!file) {
				file = files.find(f => f.name === url);
				if (file) {
					url = vault.getResourcePath(file);
				}
			}

			if (obsidianUrl && file && view) {
				const activeFile = instance.app.workspace.getActiveFile();
				if (activeFile) {
					// noinspection JSIgnoredPromiseFromCall
					instance.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
						const propName = settingProperty || instance.settingProperties.image;
						frontmatter[propName] = `[[${file?.path}]]`
					});
				}
			}
		}

		return {
			url: url.trim(),
			external,
			...options,
		};
	}

	static imageProperties(str: string): { x: number, y: number, repeatable: boolean } {
		let repeatable: boolean;
		let x = 0;
		let y = 0;

		const values = str.toLowerCase();
		repeatable = values.includes('repeat');

		const sizes = str.split(/x|,/);
		const numbers = sizes.filter(v => !isNaN(parseInt(v.trim(), 10)));

		if (numbers.length === 2) {
			x = parseInt(numbers[0].trim(), 10);
			y = parseInt(numbers[1].trim(), 10);
		} else if (numbers.length === 1) {
			y = parseInt(numbers[0].trim(), 10);
		}
		return { x, y, repeatable };
	}

	static icon(icon: string, view?: MarkdownView | null): IconData {
		const str = icon || '';
		const out = { value: null, type: IconType.Text } as IconData;

		if (RegExpression.Wikilink.test(str)) {
			out.type = IconType.Link;
		} else if (RegExpression.Markdown.test(str) || RegExpression.MarkdownBare.test(str)) {
			out.type = IconType.Link;
		} else if (RegExpression.Weblink.test(icon)) {
			out.type = IconType.Link;
		} else if (this.isObsidianUrl(icon)) {
			out.type = IconType.Link;
		}

		if (out.type === IconType.Link) {
			const data = this.link(str, view, instance.settingProperties.icon);
			out.value = data.url;
		} else {
			out.value = str;
		}

		return out;
	}

	static isImagePropertiesUpdate(oldstr?: string | null, newstr?: string | null, view?: MarkdownView | null): boolean {
		if (!oldstr || !newstr) {
			return false;
		}
		const oldopt = this.link(oldstr, view);
		const newopt = this.link(newstr, view);
		return oldopt.url === newopt.url;
	}

	static isObsidianUrl(url: string): boolean {
		return url.startsWith('obsidian://open');
	}
}
