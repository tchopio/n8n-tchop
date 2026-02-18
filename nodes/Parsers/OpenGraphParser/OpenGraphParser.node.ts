import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';

export class OpenGraphParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Parsers: OG',
		name: 'openGraphParser',
		icon: 'fa:file-code',
		group: ['transform'],
		version: 1,
		description: 'Fetch a page and parse its OpenGraph metadata',
		defaults: {
			name: 'Open Graph Parser',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the page to parse',
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
				const userMeta: Record<string, string> = (metadataParam as any)?.assignments
					? (metadataParam.assignments as Array<{ name: string; value: string }>).reduce(
						(acc, { name, value }) => ({ ...acc, [name]: value }),
						{},
					)
					: {};

				const response = await this.helpers.request({
					method: 'GET',
					uri: url,
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					},
				});

				const metadata: Record<string, any> = {};

				// Extract all meta tags
				const metaRegex = /<meta\s+([^>]+)>/gi;
				let match;
				while ((match = metaRegex.exec(response)) !== null) {
					const content = match[1].match(/content=["']([^"']*)["']/i)?.[1];
					const property = match[1].match(/property=["']([^"']*)["']/i)?.[1];
					const name = match[1].match(/name=["']([^"']*)["']/i)?.[1];

					const key = property || name;
					if (key && content !== undefined) {
						metadata[key] = content;
					}
				}

				// Unified result object
				const result = {
					url: metadata['og:url'] || url,
					title: metadata['og:title'] || response.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '',
					description: metadata['og:description'] || metadata['description'] || '',
					image: metadata['og:image'] || '',
					author:
						metadata['article:author'] ||
						metadata['author'] ||
						metadata['twitter:creator'] ||
						'',
					site_name: metadata['og:site_name'] || '',
					type: metadata['og:type'] || 'website',
					published_time: metadata['article:published_time'] || '',
					modified_time: metadata['article:modified_time'] || '',
					section: metadata['article:section'] || '',
					tags: metadata['article:tag'] || '',
					raw: metadata,
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
