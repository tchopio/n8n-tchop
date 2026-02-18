import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { tchopApiRequest } from '../shared/GenericFunctions';

export class TchopCreateArticle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Create Article',
		name: 'tchopCreateArticle',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Create an article post in tchop',
		defaults: {
			name: 'Tchop Create Article',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
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
				description: 'The ID of the story to create the post in',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'string',
				default: '',
				required: true,
				description: 'The source of the article',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: 'The title of the article',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				required: true,
				description: 'The description of the article',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the article',
			},
			{
				displayName: 'Published',
				name: 'published',
				type: 'boolean',
				default: false,
				required: true,
				description: 'Whether the article is published',
			},
			{
				displayName: 'Image',
				name: 'image',
				type: 'string',
				default: '',
				description: 'The image URL of the article',
			},
			{
				displayName: 'Author',
				name: 'author',
				type: 'string',
				default: '',
				description: 'The author of the article',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as string;
				const endpoint = `/api/v3/extension/story/${storyId}`;

				const body: IDataObject = {
					type: 'article',
					sourceName: this.getNodeParameter('source', i) as string,
					title: this.getNodeParameter('title', i) as string,
					abstract: this.getNodeParameter('description', i) as string,
					url: this.getNodeParameter('url', i) as string,
					published: this.getNodeParameter('published', i) as boolean,
				};

				const image = this.getNodeParameter('image', i) as string;
				if (image) {
					body.image = image;
				}

				const author = this.getNodeParameter('author', i) as string;
				if (author) {
					body.author = author;
				}

				const responseData = await tchopApiRequest.call(this, 'POST', endpoint, body);
				const executionData = this.helpers.returnJsonArray(responseData as IDataObject[]);
				returnData.push(...executionData);
			} catch (error) {
				const responseData = error.response?.data || {};
				const statusCode = error.response?.status;
				const errorCode = responseData.code;

				if (statusCode === 403 && errorCode === 'story-item/url-uniqueness-conflict') {
					// Ignore this specific error as requested by the user
					returnData.push({
						json: {
							success: false,
							error: 'Content already exists (uniqueness conflict)',
							code: errorCode,
							storyId: this.getNodeParameter('storyId', i),
						},
					});
					continue;
				}

				this.logger.error(
					'Tchop API request failed' +
						JSON.stringify({
							error: error.message,
							...(responseData && { responseData }),
							...(statusCode && { statusCode }),
							storyId: this.getNodeParameter('storyId', i),
						}),
				);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message, code: errorCode } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
