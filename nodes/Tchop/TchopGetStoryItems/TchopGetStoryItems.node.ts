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

export class TchopGetStoryItems implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Get Story Items',
		name: 'tchopGetStoryItems',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Get list of items from a specific story',
		defaults: {
			name: 'Tchop Get Story Items',
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
				displayName: 'Story ID',
				name: 'storyId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the story to get items from',
			},
			{
				displayName: 'Time Range',
				name: 'timeRange',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Last 24 Hours',
						value: 'last24h',
					},
					{
						name: 'Last 30 Days',
						value: 'last30d',
					},
					{
						name: 'Last 7 Days',
						value: 'last7d',
					},
					{
						name: 'Today',
						value: 'today',
					},
				],
				default: 'all',
				description: 'Filter data by time',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const getTimeLimit = (range: string) => {
			if (range === 'all') return 0;
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
				const storyId = this.getNodeParameter('storyId', i) as string;
				const timeRange = this.getNodeParameter('timeRange', i) as string;
				const timeLimit = getTimeLimit(timeRange);

				const allItems: IDataObject[] = [];
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
							const publishedAt = new Date(item.postedTime || item.created).getTime();
							if (publishedAt >= timeLimit) {
								allItems.push(sanitizeStoryItem(item as IDataObject));
								addedAny = true;
							} else {
								// Assuming items are sorted by date descending
								hasMore = false;
								break;
							}
						}

						if (itemsData.length < limit) {
							hasMore = false;
						} else if (addedAny) {
							offset += limit;
						} else {
							hasMore = false;
						}
					} else {
						hasMore = false;
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
