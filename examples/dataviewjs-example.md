Here's a simple example of how to render all links as images:

```dataviewjs
// Let's query the current file for "banner" frontmatter
const results = await dv.query(`
TABLE WITHOUT ID
banner AS "Example"
WHERE file.path = this.file.path
`);
// Grab the headers and values arrays 
const { headers, values } = results.value;

// Loop through the "rows"
values.forEach((arr, index) => {
	// Since we don't have more fields we want to show,
	// we can safely assume the banner is the first index
	const banner = arr[0];
	
	// Check if it's a actual Link Object
	if (banner instanceof Link) {
		banner.display = 200; // Set a preview image width
		banner.embed = true; // Let's make sure it's embeddeable
		arr[0] = banner;
	} else if (banner) {
		// Anything else is most likely a regular URL or a markdown link.
		// Let's strip all existing markdown tags and grab the leftover url
		const url = banner.replace(/^!?\[.*\]|\(|\)/g, '');
		const external = url.startsWith('http');
		// Let's build a new link that is embeddeable
		arr[0] = external ? `![|200](${url})` : dv.fileLink(url, true, 200);
	}
});
dv.table(headers, values);
```
