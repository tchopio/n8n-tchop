import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';
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
				displayName: 'Image URLs',
				name: 'image',
				type: 'string',
				default: '',
				description:
					'Image URLs for the article. Accepts a single URL string or a JSON array of URL strings.',
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
				const storyIdRaw = this.getNodeParameter('storyId', i) as string;
				const storyId = Number(storyIdRaw);
				if (isNaN(storyId)) {
					throw new NodeOperationError(this.getNode(), `Invalid Story ID: "${storyIdRaw}" is not a number`);
				}
				const source = this.getNodeParameter('source', i) as string;
				const title = this.getNodeParameter('title', i) as string;
				const description = this.getNodeParameter('description', i) as string;
				const url = this.getNodeParameter('url', i) as string;
				const headline = this.getNodeParameter('headline', i) as string;
				const published = this.getNodeParameter('published', i) as boolean;
				const imageRaw = (this.getNodeParameter('image', i) as string).trim();
				const author = this.getNodeParameter('author', i) as string;
				const style = this.getNodeParameter('style', i) as string;

				let image: string | string[] | undefined;
				if (imageRaw) {
					if (imageRaw.startsWith('[')) {
						const parsed = JSON.parse(imageRaw);
						if (!Array.isArray(parsed)) {
							throw new NodeOperationError(this.getNode(), 'Image URLs must be a JSON array');
						}
						image = parsed.map((v: unknown) => String(v));
					} else {
						image = imageRaw;
					}
				}

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

				const metadata = this.getNodeParameter('metadata', i, {}) as AssignmentCollectionValue;
				let metadataObj = {};
				if (metadata.assignments) {
					metadataObj = metadata.assignments.reduce(
						(acc, { name, value }) => ({ ...acc, [name]: value }),
						{},
					);
				}

				const responseData = (await createArticlePost.call(this, params)) as unknown as IDataObject;
				const executionData = this.helpers.returnJsonArray({ ...responseData, _meta: metadataObj });
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
