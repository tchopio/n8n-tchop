import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { createArticlePost, CreateArticlePostInput } from '../api/create_article';

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
				type: 'number',
				default: 0,
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
				displayName: 'Headline',
				name: 'headline',
				type: 'string',
				default: '',
				description: 'Optional headline shown above the article',
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
			{
				displayName: 'Style',
				name: 'style',
				type: 'options',
				options: [
					{
						name: 'Standard',
						value: 'STANDARD',
					},
					{
						name: 'Big Without Text',
						value: 'BIG_WITHOUT_TEXT',
					},
					{
						name: 'Small Without Text',
						value: 'SMALL_WITHOUT_TEXT',
					},
					{
						name: 'Small With Text',
						value: 'SMALL_WITH_TEXT',
					},
				],
				default: 'STANDARD',
				description: 'The style of the article card',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as number;
				const source = this.getNodeParameter('source', i) as string;
				const title = this.getNodeParameter('title', i) as string;
				const description = this.getNodeParameter('description', i) as string;
				const url = this.getNodeParameter('url', i) as string;
				const headline = this.getNodeParameter('headline', i) as string;
				const published = this.getNodeParameter('published', i) as boolean;
				const image = this.getNodeParameter('image', i) as string;
				const author = this.getNodeParameter('author', i) as string;
				const style = this.getNodeParameter('style', i) as string;

				const params: CreateArticlePostInput = {
					storyId,
					source,
					title,
					description,
					url,
					headline,
					published,
					image,
					author,
					style,
				};

				const responseData = (await createArticlePost.call(this, params)) as unknown as IDataObject;
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
