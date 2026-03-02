import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { createSocialPost, CreateSocialPostInput } from '../api/create_social_post';

export class TchopCreateSocial implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Create Social',
		name: 'tchopCreateSocial',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Create a social post in tchop',
		defaults: {
			name: 'Tchop Create Social',
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
				type: 'number',
				default: 0,
				required: true,
				description: 'The ID of the story to create the post in',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the social post',
			},
			{
				displayName: 'Headline',
				name: 'headline',
				type: 'string',
				default: '',
				description: 'Optional headline/comment shown above the quote text',
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
				displayName: 'Text',
				name: 'text',
				type: 'string',
				default: '',
				description: 'Quote text of the social post',
			},
			{
				displayName: 'Quote Person',
				name: 'quotePerson',
				type: 'string',
				default: '',
				description: 'Name of the person being quoted',
			},
			{
				displayName: 'Quote Person Handle',
				name: 'quotePersonHandle',
				type: 'string',
				default: '',
				description: 'Social handle of the person being quoted',
			},
			{
				displayName: 'Quote Person Image',
				name: 'quotePersonImage',
				type: 'string',
				default: '',
				description: 'Image URL of the person being quoted',
			},
			{
				displayName: 'Quote Created',
				name: 'quoteCreated',
				type: 'dateTime',
				default: '',
				description: 'Date and time when the social post was created',
			},
			{
				displayName: 'Image URLs (JSON Array)',
				name: 'imageUrls',
				type: 'string',
				default: '',
				description: 'Optional JSON array of image URLs to attach to the post',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

 	for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as number;
				const url = this.getNodeParameter('url', i) as string;
				const headline = this.getNodeParameter('headline', i) as string;
				const published = this.getNodeParameter('published', i) as boolean;
				const text = this.getNodeParameter('text', i) as string;
				const quotePerson = this.getNodeParameter('quotePerson', i) as string;
				const quotePersonHandle = this.getNodeParameter('quotePersonHandle', i) as string;
				const quotePersonImage = this.getNodeParameter('quotePersonImage', i) as string;
				const quoteCreated = this.getNodeParameter('quoteCreated', i) as string;
				const imageUrlsRaw = this.getNodeParameter('imageUrls', i) as string;
				let imageUrls: string[] = [];
				if (imageUrlsRaw) {
					try {
						const parsed = JSON.parse(imageUrlsRaw);
						if (!Array.isArray(parsed)) {
							throw new NodeOperationError(this.getNode(), 'Image URLs must be a JSON array');
						}
						imageUrls = parsed.map((v) => String(v));
					} catch (e) {
						throw new NodeOperationError(this.getNode(), `Invalid JSON in Image URLs: ${(e as Error).message}`);
					}
				}

				const params: CreateSocialPostInput = {
					storyId,
					url,
					headline,
					published,
					text,
					quotePerson,
					quotePersonHandle,
					quotePersonImage,
					quoteCreated,
					imageUrls,
				};
				const responseData = (await createSocialPost.call(this, params)) as unknown as IDataObject;
				const executionData = this.helpers.returnJsonArray(responseData);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
