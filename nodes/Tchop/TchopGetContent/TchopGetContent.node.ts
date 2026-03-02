import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { tchopApiRequest } from '../shared/GenericFunctions';
import { sanitizeStoryItem } from '../shared/SanitizeFunctions';

export class TchopGetContent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Get Content',
		name: 'tchopGetContent',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Gather content from tchop platform for a specific channel and time range',
		defaults: {
			name: 'Tchop Get Content',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'tchopApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the channel to gather content from',
			},
			{
				displayName: 'Story IDs',
				name: 'storyIds',
				type: 'string',
				default: '',
				description: 'Optional list of story IDs (comma-separated). If empty, all stories from the channel will be used.',
			},
			{
				displayName: 'Time Range',
				name: 'timeRange',
				type: 'options',
				options: [
					{
						name: 'Today',
						value: 'today',
					},
					{
						name: 'Last 24 Hours',
						value: 'last24h',
					},
					{
						name: 'Last 7 Days',
						value: 'last7d',
					},
					{
						name: 'Last 30 Days',
						value: 'last30d',
					},
				],
				default: 'last24h',
				description: 'Filter data by time',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const getTimeLimit = (range: string) => {
			const limit = new Date();
			switch (range) {
				case 'today':
					limit.setHours(0, 0, 0, 0);
					break;
				case 'last24h':
					limit.setHours(limit.getHours() - 24);
					break;
				case 'last7d':
					limit.setDate(limit.getDate() - 7);
					break;
				case 'last30d':
					limit.setDate(limit.getDate() - 30);
					break;
			}
			return limit.getTime();
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const channelId = this.getNodeParameter('channelId', i) as string;
				const storyIdsParam = this.getNodeParameter('storyIds', i) as string;
				const timeRange = this.getNodeParameter('timeRange', i) as string;
				const timeLimit = getTimeLimit(timeRange);

				let storyIds: string[] = [];
				if (storyIdsParam) {
					storyIds = storyIdsParam.split(',').map((id) => id.trim());
				} else {
					// Fetch stories for the channel
					// Use api/v4/channels/CHANNEL_ID?excludeItems=true
					const storiesResponse = await tchopApiRequest.call(
						this,
						'GET',
						`/api/v4/channels/${channelId}`,
						{},
						{ excludeItems: true },
					);
					if (storiesResponse && storiesResponse.stories && Array.isArray(storiesResponse.stories)) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					storyIds = storiesResponse.stories.map((story: any) => story.id);
					}
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const allItems: any[] = [];
				for (const storyId of storyIds) {
					let offset = 0;
					const limit = 75;
					let hasMore = true;
					while (hasMore) {
						const itemsResponse = await tchopApiRequest.call(
							this,
							'GET',
							`/api/v4/stories/${storyId}/items`,
							{},
							{ offset, limit },
						);

						const itemsData = itemsResponse?.data;

						if (itemsData && Array.isArray(itemsData)) {
							let addedAny = false;
							for (const item of itemsData) {
								const publishedAt = new Date(item.publishedAt || item.createdAt).getTime();
								if (publishedAt >= timeLimit) {
									const sanitizedItem = sanitizeStoryItem(item as IDataObject);
									allItems.push({
										...sanitizedItem,
										storyId,
										channelId,
									});
									addedAny = true;
								} else {
									// Assuming items are sorted by date descending, so we can stop here
									hasMore = false;
									break;
								}
							}

							if (itemsData.length < limit) {
								hasMore = false;
							} else if (addedAny) {
								offset += limit;
							} else {
								// If we didn't add any item and we already checked a full page,
								// it means all items on this page and subsequent pages are older than timeLimit
								hasMore = false;
							}
						} else {
							hasMore = false;
						}
					}
				}

				const executionData = this.helpers.returnJsonArray(allItems as IDataObject[]);
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
