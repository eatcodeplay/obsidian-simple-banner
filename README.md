# Simple Banner

Enhance your Obsidian notes with a visually striking banner image at the top, seamlessly integrated with your content. This plugin also intelligently manages the display of your frontmatter properties, ensuring they remain accessible without overlapping your chosen banner.



## Key features

* Easily add banner images to your notes and control their options using **a single frontmatter property**.
* Frontmatter property name is **customizable**.
* Supports **external** and **internal** images (Image URLs, Wikilink, Markdown links and Obsidian URLs).
* Property value is **always a well-formed url/link**, so you can use it for other things as well - like [Dataview](https://github.com/blacksmithgu/obsidian-dataview).
* **Visually appealing and UX friendly:** All your Frontmatter properties are neatly tucked away, but easily accessible if needed.
* Options to control **image repeat** and horizontal/vertical **offset**.
* **Customizable banner height** for different device types (desktop, tablet, mobile).
* Adjustable **border radius for each corner** individually.
* Adjustable **padding**.
* **Optional fade effect to blend the banner** with the note content.
* Highly optimized plugin that is **fast** and **small**.



## Demo

https://github.com/user-attachments/assets/94e054c5-8231-4a13-8b0e-0a29e832ec10

## Examples

> [!NOTE]
> For demonstration purposes the below examples are shown as `YAML` syntax.
>
> * You can add an image in  `Source Mode` or `Live Preview`
> * The examples assume you left the default property name `banner` (changeable in the [settings](#Settings)).

To get you started, the minimum is:

```yaml
# External URL
---
banner: https://link.com/to/your/image.jpg
---

# Internal Asset (Wikilink).
# Optional: add a ! infront, to make it embeddable for things like Dataview
---
banner: [[path/image.jpg]]
---

# Internal or External Asset (Markdown Link)
# Optional: add a ! infront, to make it embeddable
---
banner: [](path/image.jpg)
---

# Or even an Obsidian URL (will be transformed to a Wikilink)
---
banner: obsidian://open?vault=my-vault&file=path%2Fimage.jpg
---
```

Obviously you can do this either in `Source Mode` or `Live Preview` .

Want to add an vertical offset? Sure thing - positive or negative numbers are supported:

```yaml
# External URL
---
banner: https://link.com/to/your/image.jpg#20
---

# Internal Asset (Wikilink)
---
banner: [[path/image.jpg|20]]
---

# Internal Asset (Markdown)
---
banner: [20](path/image.jpg)
---
```

What about a horizontal offset?

```yaml
# External URL
---
banner: https://link.com/to/your/image.jpg#20x20
---

# Internal Asset (Wikilink)
---
banner: [[path/image.jpg|20x20]]
---

# Internal Asset (Markdown)
---
banner: [20x20](path/image.jpg)
---
```

Having a horizontal offset is mostly useful for repeatable images, so there is support for that as well:

```yaml
# External URL
---
banner: https://link.com/to/your/image.jpg#20x20,repeat
---

# Internal Asset (Wikilink)
---
banner: [[path/image.jpg|20x20,repeat]]
---

# Internal Asset (Markdown)
---
banner: [20x20,repeat](path/image.jpg)
---
```




## Settings

You can customize the appearance and behavior of Simple Banner. The following settings are available:

**Global Settings:**

- **Note Offset:** Adjust the vertical position (+/-) of the note content below the banner in pixels.
- **Border Radius:** Set the border radius for each of the four corners of the banner image in pixels (top-left, top-right, bottom-right, bottom-left).
- **Padding:** Control the spacing between the banner image and the edges of the note in pixels.
- **Fade:** Toggle whether to apply a fade effect to the bottom of the banner image.

**Height Settings:**

- **Desktop:** Define the banner height for desktop devices in pixels.
- **Tablet:** Define the banner height for tablet devices in pixels.
- **Mobile:** Define the banner height for mobile devices in pixels.

**Frontmatter Settings:**

- **Property Name:** Change the name of the frontmatter property that the plugin looks for (default is `banner`).



## Installation

This plugin is currently not available in the Obsidian Community Plugins.
You can install it either by using [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) or manually by following the instructions below:

1.  Download the latest release from the [Releases](https://github.com/eatcodeplay/obsidian-simple-banner/releases) page.
2.  Extract the downloaded ZIP content into a new folder in your Obsidian vault's plugins folder (e.g., `<your_vault>/.obsidian/plugins/simple-banner`).
3.  **Note:** On some operating systems, the `.obsidian` folder might be hidden. Make sure to show hidden files in your file explorer.
4.  Open Obsidian.
5.  Go to `Settings` -> `Community plugins`.
6.  Make sure `Safe mode` is off.
7.  Find "Simple Banner" in the list and enable it.

## Contributing

If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/eatcodeplay/obsidian-simple-banner/).

## License

[MIT License](LICENSE)

---

**Enjoy adding Banners to your notes!**
