// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import Parser from 'rss-parser';

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

export class RssParserWrapper {
	private parser: Parser;

	constructor() {
		this.parser = new Parser({
			customFields: {
				item: [
					['media:group', 'mediaGroup'],
					['media:content', 'mediaContent', { keepArray: true }],
					['media:thumbnail', 'mediaThumbnail'],
					['media:description', 'mediaDescription'],
					['media:community', 'mediaCommunity'],
					['itunes:image', 'itunesImage'],
					['itunes:author', 'itunesAuthor'],
					['itunes:summary', 'itunesSummary'],
					['itunes:subtitle', 'itunesSubtitle'],
					['itunes:duration', 'itunesDuration'],
					['dc:creator', 'dcCreator'],
				],
			},
		});
	}

	async parseURL(url: string): Promise<BaseRssItem[]> {
		const feed = await this.parser.parseURL(url);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return feed.items.map((item) => this.transformItem(item as Record<string, any>, feed as Record<string, any>));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private transformItem(item: Record<string, any>, feed: Record<string, any>): BaseRssItem {
		const guid = (item.guid || item.id || item.link || '').toString();
		const url = (item.link || '').toString();
		const title = (item.title || '').toString();

		// Content / Description
		const content = (item.content || item.summary || item.itunesSummary || '').toString();
		let description = (item.contentSnippet || item.itunesSubtitle || item.mediaDescription || content || '').toString();

		// If it's a YouTube feed, mediaGroup might have a better description
		if (item.mediaGroup && item.mediaGroup['media:description']) {
			description = item.mediaGroup['media:description'][0];
		}

		// Image URL Extraction
		let imageUrl = '';
		if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
			imageUrl = item.enclosure.url;
		} else if (item.mediaContent) {
			const mediaArray = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const imageMedia = mediaArray.find((m: any) => m.$?.medium === 'image' || m.$?.type?.startsWith('image/')) || mediaArray[0];
			imageUrl = imageMedia?.$?.url || '';
		} else if (item.mediaThumbnail) {
			imageUrl = item.mediaThumbnail?.$?.url || '';
		} else if (item.itunesImage) {
			imageUrl = typeof item.itunesImage === 'string' ? item.itunesImage : item.itunesImage?.$?.href || '';
		} else if (item.mediaGroup && item.mediaGroup['media:thumbnail']) {
			imageUrl = item.mediaGroup['media:thumbnail'][0]?.$?.url || '';
		}

		// Fallback: extract from content
		if (!imageUrl && content) {
			const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
			if (imgMatch) {
				imageUrl = imgMatch[1];
			}
		}

		// Author Info
		let authorName = (item.author || item.creator || item.dcCreator || item.itunesAuthor || item.itunes?.author || '').toString();
		let authorHandle = '';
		let authorImage = '';

		// Root Channel info as fallbacks
		const rootAuthorName = (feed.itunes?.author || feed.itunes?.owner?.name || feed.title || '').toString();
		const rootAuthorHandle = (feed.link || '').toString();
		const rootAuthorImage = (feed.image?.url || feed.itunes?.image || '').toString();

		// YouTube specific author image
		if (!rootAuthorImage && feed.items?.[0]?.author?.uri?.includes('youtube.com')) {
			// YouTube RSS doesn't provide channel image easily in the feed,
			// but we've already done our best with standard fields.
		}

		if (!authorName) {
			authorName = rootAuthorName;
		}

		if (!authorHandle) {
			authorHandle = rootAuthorHandle;
		}

		if (!authorImage) {
			authorImage = rootAuthorImage;
		}

		// YouTube specific author extraction
		if (item.author && typeof item.author === 'object') {
			// Some parsers might return object for author
		}

		// If it's a YouTube feed, it might have author info in a specific way
		if (item.mediaGroup && item.mediaGroup['media:community']) {
			// This is just an example, YouTube RSS doesn't always have author image here
		}

		// Support for some podcast/other feeds that might have author as an object with name/uri/etc
		if (typeof item.author === 'object') {
			authorName = item.author.name || authorName;
			authorHandle = item.author.uri || authorHandle;
		}

		const source = (feed.title || '').toString();

		return {
			title,
			description,
			content,
			url,
			imageUrl,
			guid,
			pubDate: item.isoDate || item.pubDate || '',
			source,
			categories: item.categories || [],
			author: {
				name: authorName,
				handle: authorHandle,
				image: authorImage,
			},
			raw: item,
		};
	}
}
