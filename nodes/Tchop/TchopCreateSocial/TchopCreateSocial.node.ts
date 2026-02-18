import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { tchopApiRequest } from '../shared/GenericFunctions';

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
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the story to create the post in',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyId = this.getNodeParameter('storyId', i) as string;
				const endpoint = `/root/api/v3/extension/story/${storyId}`;

				const body: IDataObject = {
					// Social fields
				};

				const responseData = await tchopApiRequest.call(this, 'POST', endpoint, body);
				const executionData = this.helpers.returnJsonArray(responseData as IDataObject[]);
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
