import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import Parser from 'rss-parser';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';

export class RssParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Parsers: RSS',
		name: 'rssParser',
		group: ['transform'],
		version: 1,
		description: 'Fetch and parse an RSS feed and output items',
		defaults: {
			name: 'RSS Parser',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'RSS URL',
				name: 'rssUri',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL to the RSS feed',
			},
			{
				displayName: 'Source ID',
				name: 'sourceId',
				type: 'string',
				default: '',
				required: true,
				description: 'Identifier to track seen items per source',
			},
			{
				displayName: 'Trigger Only On New',
				name: 'triggerOnNew',
				type: 'boolean',
				default: true,
				description: 'If enabled, only emit items not seen before for this Source ID',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				required: true,
				description: 'The maximum number of items to return from the RSS feed',
			},
			{
				displayName: 'Max Seen Items',
				name: 'maxSeenItems',
				type: 'number',
				default: 500,
				required: true,
				description:
					'The maximum number of seen identifiers to store in static data to prevent overflow',
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
		const parser = new Parser();

		for (let i = 0; i < items.length; i++) {
			try {
				const rssUri = this.getNodeParameter('rssUri', i) as string;
				const sourceId = this.getNodeParameter('sourceId', i) as string;
				const triggerOnNew = this.getNodeParameter('triggerOnNew', i) as boolean;
				const limit = this.getNodeParameter('limit', i) as number;
				const maxSeenItems = this.getNodeParameter('maxSeenItems', i) as number;
				const metadata = this.getNodeParameter('metadata', i, {}) as AssignmentCollectionValue;
				const metadataObj = metadata.assignments.reduce(
					(acc, { name, value }) => ({ ...acc, [name]: value }),
					{},
				);

				const feed = await parser.parseURL(rssUri);
				const itemsToProcess = (feed.items ?? []).slice(0, limit);

				// Persistent storage per node, partitioned by sourceId
				const staticData = this.getWorkflowStaticData('node') as any;
				if (!staticData.seenBySource) staticData.seenBySource = {} as Record<string, string[]>;
				if (!staticData.seenBySource[sourceId]) staticData.seenBySource[sourceId] = [];
				const seen = new Set<string>(staticData.seenBySource[sourceId]);

				const itemsOut: Array<{
					title?: string;
					description?: string;
					url?: string;
					guid?: string;
					_meta?: Record<string, string>;
				}> = [];

				for (const item of itemsToProcess) {
					const guid = (item.guid || item.id || item.link || '').toString();
					const url = (item.link || '').toString();
					const title = (item.title || '').toString();
					const description = (
						item.contentSnippet ||
						item.content ||
						item.summary ||
						''
					).toString();

					const identifier = guid || url;
					if (triggerOnNew) {
						if (identifier && seen.has(identifier)) {
							continue; // skip already seen
						}
					}

					itemsOut.push({
						title,
						description,
						url,
						guid: guid || undefined,
						_meta: metadataObj,
					});

					if (identifier) {
						seen.add(identifier);
					}
				}

				// Save back seen identifiers, but keep only the last maxSeenItems to avoid overflow
				let newSeenArray = Array.from(seen);
				if (newSeenArray.length > maxSeenItems) {
					newSeenArray = newSeenArray.slice(-maxSeenItems);
				}
				staticData.seenBySource[sourceId] = newSeenArray;
				// Mark static data as changed so n8n persists it between executions (especially in manual runs)
				(staticData as any).__dataChanged = true;

				// If triggerOnNew is false and feed had no items, itemsOut stays empty (expected)
				const executionData = this.helpers.returnJsonArray(itemsOut as any);
				returnData.push(...executionData);
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
