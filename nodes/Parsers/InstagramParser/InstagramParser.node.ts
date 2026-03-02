import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';

export class InstagramParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Parsers: Instagram',
		name: 'instagramParser',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Fetch an Instagram post and parse its metadata',
		defaults: {
			name: 'Instagram Parser',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Instagram URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the Instagram post to parse (e.g. https://www.instagram.com/p/XXXXX/)',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'assignmentCollection',
				default: {},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const url = this.getNodeParameter('url', i) as string;
				const metadataParam = this.getNodeParameter('metadata', i, {}) as AssignmentCollectionValue;
				const userMeta: Record<string, string> = metadataParam?.assignments
					? (metadataParam.assignments as Array<{ name: string; value: string }>).reduce(
						(acc, { name, value }) => ({ ...acc, [name]: value }),
						{},
					)
					: {};

				const response = (await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						'User-Agent':
							'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.9',
						'Cache-Control': 'no-cache',
						'Pragma': 'no-cache',
					},
				})) as string;

				const metaTags: Record<string, string> = {};

				// Extract all meta tags
				const metaRegex = /<meta\s+([^>]+)>/gi;
				let match;
				while ((match = metaRegex.exec(response)) !== null) {
					const metaTag = match[1];
					const content = metaTag.match(/content=["']([^"']*)["']/i)?.[1];
					const property = metaTag.match(/property=["']([^"']*)["']/i)?.[1];
					const name = metaTag.match(/name=["']([^"']*)["']/i)?.[1];

					const key = property || name;
					if (key && content !== undefined) {
						metaTags[key] = content;
					}
				}

				// Extract JSON-LD or sharedData if available
				let authorName = '';
				let authorHandle = '';
				let authorImage = '';
				let postText = metaTags['og:description'] || '';
				const postImages: string[] = [];
				let postVideo = metaTags['og:video'] || '';

				// Try to find author in title if it's like "Name (@handle) • Instagram photos"
				if (metaTags['og:title']) {
					const titleMatch = metaTags['og:title'].match(/(.*) \(@([^)]+)\)/);
					if (titleMatch) {
						authorName = titleMatch[1].trim();
						authorHandle = titleMatch[2].trim();
					}
				}

				// Try to find data in JSON-LD
				const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
				let jsonLdMatch;
				while ((jsonLdMatch = jsonLdRegex.exec(response)) !== null) {
					try {
						const data = JSON.parse(jsonLdMatch[1]);
						const ldItems = Array.isArray(data) ? data : [data];

						for (const item of ldItems) {
							if (item.author) {
								if (typeof item.author === 'string') {
									authorName = authorName || item.author;
								} else {
									authorName = item.author.name || authorName;
									authorHandle = item.author.alternateName || authorHandle;
									authorImage = item.author.image || authorImage;
								}
							}
							if (item.articleBody) {
								postText = item.articleBody;
							}
							if (item.image && !postImages.length) {
								if (typeof item.image === 'string') {
									postImages.push(item.image);
								} else if (item.image.url) {
									postImages.push(item.image.url);
								}
							}
							if (item.video && !postVideo) {
								postVideo = item.video.contentUrl || item.video.url || '';
							}
						}
					} catch (ignore) {}
				}

				// Fallback for post text from description if it's like "Handle on Instagram: 'Text'"
				if (!postText || postText === metaTags['og:description']) {
					const descMatch = (metaTags['og:description'] || '').match(/.*on Instagram: ["']([\s\S]*)["']/);
					if (descMatch) {
						postText = descMatch[1];
					}
				}

				// Fallback: search for data in any script tags containing JSON
				const anyScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
				let scriptMatch;
				while ((scriptMatch = anyScriptRegex.exec(response)) !== null) {
					const scriptContent = scriptMatch[1];
					if (scriptContent.includes('display_url') || scriptContent.includes('full_name') || scriptContent.includes('username')) {
						// Try to unescape unicode sequences
						const unescaped = scriptContent.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

						if (!authorName) {
							const nameMatch = unescaped.match(/"full_name":"([^"]+)"/);
							if (nameMatch) authorName = nameMatch[1];
						}
						if (!authorHandle) {
							const handleMatch = unescaped.match(/"username":"([^"]+)"/);
							if (handleMatch) authorHandle = handleMatch[1];
						}
						if (!authorImage) {
							const imgMatch = unescaped.match(/"profile_pic_url":"([^"]+)"/);
							if (imgMatch) authorImage = imgMatch[1].replace(/\\/g, '');
						}
						if (!postText) {
							const textMatch = unescaped.match(/"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]+)"/);
							if (textMatch) postText = textMatch[1].replace(/\\n/g, '\n');
						}
						if (postImages.length === 0) {
							const imgMatch = unescaped.match(/"display_url":"([^"]+)"/);
							if (imgMatch) postImages.push(imgMatch[1].replace(/\\/g, ''));
						}
						if (!postVideo) {
							const vidMatch = unescaped.match(/"video_url":"([^"]+)"/);
							if (vidMatch) postVideo = vidMatch[1].replace(/\\/g, '');
						}
					}
				}

				if (metaTags['og:image'] && !postImages.includes(metaTags['og:image'])) {
					postImages.push(metaTags['og:image']);
				}

				// Unified result object
				const result = {
					url: metaTags['og:url'] || url,
					authorName: authorName || 'Instagram User',
					authorHandle: authorHandle,
					authorImage: authorImage,
					text: postText,
					images: postImages,
					video: postVideo,
					raw: metaTags,
					_meta: userMeta,
				};

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
