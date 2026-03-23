import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { tchopGraphQLRequest } from '../api/client';
import { GET_STORY_CARDS_FEED_QUERY } from '../shared/graphql/templates';
import { GetStoryCardsFeedResult, StoryCardFeedItem } from '../shared/graphql/models';

function formatStoryCard(card: StoryCardFeedItem): IDataObject {
	const content = card.content as IDataObject;

	const result: IDataObject = {
		id: card.id,
		postedTime: card.postedAt,
		type: card.type,
		created: card.createdAt,
		updated: card.updatedAt,
		storyId: card.storyId,
		position: card.position,
		commentsCount: card.commentsCount,
		status: card.status,
		title: content.title,
		url: content.url,
		sourceName: content.sourceName,
		headline: content.headline,
		abstract: content.abstract,
		contentAuthor: content.contentAuthor,
		contentReadTime: content.contentReadTime,
	};

	if (card.author) {
		result.author = {
			name: card.author.screenName,
		};
	}

	const gallery = content.gallery as Array<{ image?: { url?: string } }> | undefined;
	if (gallery && gallery.length > 0 && gallery[0].image) {
		result.image = {
			url: gallery[0].image.url,
		};
	}

	return result;
}

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

		const getFromDate = (range: string): string | undefined => {
			if (range === 'all') return undefined;
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
			return limit.toISOString();
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = parseInt(this.getNodeParameter('storyId', i) as string, 10);
				const timeRange = this.getNodeParameter('timeRange', i) as string;
				const from = getFromDate(timeRange);

				const allCards: IDataObject[] = [];
				let page = 1;
				const size = 15;
				let hasMore = true;

				while (hasMore) {
					const variables: IDataObject = {
						storyId,
						orderDirection: 'DESC',
						page,
						size,
					};

					if (from) {
						variables.filter = { from };
					}

					const result = await tchopGraphQLRequest.call(
						this,
						GET_STORY_CARDS_FEED_QUERY,
						variables,
					);

					const payload = (result as GetStoryCardsFeedResult).storyCardsFeed.payload;

					if (payload.items && payload.items.length > 0) {
						for (const card of payload.items) {
							allCards.push(formatStoryCard(card));
						}
					}

					hasMore = payload.pageInfo.hasNextPage;
					page++;
				}

				const executionData = this.helpers.returnJsonArray(allCards);
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
