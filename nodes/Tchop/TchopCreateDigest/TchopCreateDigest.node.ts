import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { createDigestPost, DigestCreateParams } from '../shared/graphql/digest';

export class TchopCreateDigest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Create Digest',
		name: 'tchopCreateDigest',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Create a digest post in tchop',
		defaults: {
			name: 'Tchop Create Digest',
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
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: 'The title of the digest',
			},
			{
				displayName: 'Headline',
				name: 'headline',
				type: 'string',
				default: '',
				description: 'Headline shown in the digest (defaults to Title if empty)',
			},
			{
				displayName: 'Source Name',
				name: 'sourceName',
				type: 'string',
				default: 'n8n',
				description: 'Source name to attribute the digest to',
			},
			{
				displayName: 'Abstract',
				name: 'abstract',
				type: 'string',
				default: '',
				description: 'The abstract of the digest',
			},
			{
				displayName: 'Content (JSON Array)',
				name: 'content',
				type: 'string',
				default: '',
				description: 'The content of the digest as a JSON array of content blocks',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as string;
				const title = this.getNodeParameter('title', i) as string;
				const headline = this.getNodeParameter('headline', i) as string;
				const sourceName = this.getNodeParameter('sourceName', i) as string;
				const abstract = this.getNodeParameter('abstract', i) as string;
				const content = this.getNodeParameter('content', i) as string;
				let contentBlocks: IDataObject[] = [];
				if (content) {
					try {
						contentBlocks = JSON.parse(content);
						if (!Array.isArray(contentBlocks)) {
							throw new NodeOperationError(this.getNode(), 'Content must be a JSON array of blocks');
						}
					} catch (e) {
						throw new NodeOperationError(this.getNode(), `Invalid JSON in Content: ${(e as Error).message}`);
					}
				}

				const params: DigestCreateParams = {
					storyId: parseInt(storyId, 10),
					title,
					headline,
					sourceName,
					abstract,
					contentBlocks: contentBlocks as any,
				};
				const responseData = (await createDigestPost.call(this, params)) as unknown as IDataObject;
				// Handle potential nested data object from graphql-request
				const data = JSON.parse(JSON.stringify(responseData));
				const executionData = this.helpers.returnJsonArray(data as IDataObject);
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
