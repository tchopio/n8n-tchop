export interface BaseRssItem {
	title: string;
	description: string;
	content: string;
	url: string;
	imageUrl: string;
	guid: string;
	pubDate: string;
	source: string;
	categories: string[];
	author: {
		name: string;
		handle?: string;
		image?: string;
	};
	raw?: unknown;
}

interface RawFeed {
	title: string;
	link: string;
	imageUrl: string;
	itunesAuthor: string;
	items: RawItem[];
}

interface RawItem {
	title: string;
	link: string;
	guid: string;
	description: string;
	content: string;
	pubDate: string;
	author: string;
	categories: string[];
	enclosureUrl: string;
	enclosureType: string;
	mediaContentUrl: string;
	mediaThumbnailUrl: string;
	mediaDescription: string;
	itunesAuthor: string;
	itunesImage: string;
	itunesSummary: string;
	itunesSubtitle: string;
	dcCreator: string;
}

/**
 * Extract text content from an XML tag, handling CDATA sections.
 */
function tagText(xml: string, tag: string): string {
	// Match both namespaced and non-namespaced, handle CDATA
	const re = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i');
	const m = xml.match(re);
	if (!m) return '';
	return (m[1] ?? m[2] ?? '').trim();
}

/**
 * Extract an attribute value from the first occurrence of a tag.
 */
function tagAttr(xml: string, tag: string, attr: string): string {
	const re = new RegExp(`<${tag}[^>]*?\\s${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
	return xml.match(re)?.[1] ?? '';
}

/**
 * Split XML into blocks matching a given tag.
 */
function splitTag(xml: string, tag: string): string[] {
	const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi');
	return xml.match(re) ?? [];
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function parseRawItem(itemXml: string): RawItem {
	return {
		title: tagText(itemXml, 'title'),
		link: tagText(itemXml, 'link') || tagAttr(itemXml, 'link', 'href'),
		guid: tagText(itemXml, 'guid') || tagText(itemXml, 'id'),
		description: tagText(itemXml, 'description') || tagText(itemXml, 'summary'),
		content: tagText(itemXml, 'content:encoded') || tagText(itemXml, 'content'),
		pubDate: tagText(itemXml, 'pubDate') || tagText(itemXml, 'published') || tagText(itemXml, 'updated'),
		author: tagText(itemXml, 'author') || tagText(itemXml, 'dc:creator'),
		categories: splitTag(itemXml, 'category').map((c) => tagText(c, 'category') || stripHtml(c)),
		enclosureUrl: tagAttr(itemXml, 'enclosure', 'url'),
		enclosureType: tagAttr(itemXml, 'enclosure', 'type'),
		mediaContentUrl: tagAttr(itemXml, 'media:content', 'url'),
		mediaThumbnailUrl: tagAttr(itemXml, 'media:thumbnail', 'url'),
		mediaDescription: tagText(itemXml, 'media:description'),
		itunesAuthor: tagText(itemXml, 'itunes:author'),
		itunesImage: tagAttr(itemXml, 'itunes:image', 'href'),
		itunesSummary: tagText(itemXml, 'itunes:summary'),
		itunesSubtitle: tagText(itemXml, 'itunes:subtitle'),
		dcCreator: tagText(itemXml, 'dc:creator'),
	};
}

function parseFeed(xml: string): RawFeed {
	// Detect Atom vs RSS
	const isAtom = /<feed[\s>]/i.test(xml);
	const itemTag = isAtom ? 'entry' : 'item';

	return {
		title: tagText(xml, 'title'),
		link: isAtom ? tagAttr(xml, 'link', 'href') : tagText(xml, 'link'),
		imageUrl: tagAttr(xml, 'itunes:image', 'href')
			|| tagText(xml, 'url')  // inside <image><url>
			|| '',
		itunesAuthor: tagText(xml, 'itunes:author'),
		items: splitTag(xml, itemTag).map(parseRawItem),
	};
}

export class RssParserWrapper {
	parseXml(xml: string): BaseRssItem[] {
		const feed = parseFeed(xml);
		return feed.items.map((item) => this.transformItem(item, feed));
	}

	private transformItem(item: RawItem, feed: RawFeed): BaseRssItem {
		const guid = item.guid || item.link || '';
		const url = item.link || '';
		const title = item.title || '';

		const content = item.content || item.description || item.itunesSummary || '';
		const description = item.itunesSubtitle
			|| item.mediaDescription
			|| stripHtml(item.description || content)
			|| '';

		// Image URL extraction
		let imageUrl = '';
		if (item.enclosureUrl && item.enclosureType?.startsWith('image/')) {
			imageUrl = item.enclosureUrl;
		} else if (item.mediaContentUrl) {
			imageUrl = item.mediaContentUrl;
		} else if (item.mediaThumbnailUrl) {
			imageUrl = item.mediaThumbnailUrl;
		} else if (item.itunesImage) {
			imageUrl = item.itunesImage;
		}

		// Fallback: extract from content HTML
		if (!imageUrl && content) {
			const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
			if (imgMatch) {
				imageUrl = imgMatch[1];
			}
		}

		// Author
		const authorName = item.author || item.dcCreator || item.itunesAuthor || feed.itunesAuthor || feed.title || '';
		const authorHandle = feed.link || '';
		const authorImage = feed.imageUrl || '';

		// Parse date to ISO
		let pubDate = item.pubDate || '';
		if (pubDate) {
			const parsed = new Date(pubDate);
			if (!isNaN(parsed.getTime())) {
				pubDate = parsed.toISOString();
			}
		}

		const source = feed.title || '';

		return {
			title,
			description,
			content,
			url,
			imageUrl,
			guid,
			pubDate,
			source,
			categories: item.categories.filter(Boolean),
			author: {
				name: authorName,
				handle: authorHandle,
				image: authorImage,
			},
			raw: item,
		};
	}
}
