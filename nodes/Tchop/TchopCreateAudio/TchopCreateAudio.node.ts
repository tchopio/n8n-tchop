import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { createAudioPost, CreateAudioPostInput } from '../api/create_audio';

export class TchopCreateAudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Create Audio',
		name: 'tchopCreateAudio',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Create an audio post in tchop',
		defaults: {
			name: 'Tchop Create Audio',
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
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the audio file to upload',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the audio',
			},
			{
				displayName: 'Headline',
				name: 'headline',
				type: 'string',
				default: '',
				description: 'Optional headline shown above the audio',
			},
			{
				displayName: 'Sub Headline',
				name: 'subHeadline',
				type: 'string',
				default: '',
				description: 'Optional sub headline',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				default: '',
				description: 'Optional description text',
			},
			{
				displayName: 'Source Name',
				name: 'sourceName',
				type: 'string',
				default: '',
				description: 'Optional source name',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				description: 'Optional image URL for the audio post',
			},
			{
				displayName: 'Published',
				name: 'published',
				type: 'boolean',
				default: false,
				required: true,
				description: 'Whether the article is published',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as number;
				const audioUrl = this.getNodeParameter('audioUrl', i) as string;
				const title = this.getNodeParameter('title', i) as string;
				const headline = this.getNodeParameter('headline', i) as string;
				const subHeadline = this.getNodeParameter('subHeadline', i) as string;
				const text = this.getNodeParameter('text', i) as string;
				const sourceName = this.getNodeParameter('sourceName', i) as string;
				const imageUrl = this.getNodeParameter('imageUrl', i) as string;
				const published = this.getNodeParameter('published', i) as boolean;

				const params: CreateAudioPostInput = {
					storyId,
					audioUrl,
					title,
					headline,
					subHeadline,
					text,
					sourceName,
					imageUrl,
					published,
				};

				const responseData = (await createAudioPost.call(this, params)) as unknown as IDataObject;
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
