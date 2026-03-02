import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { getStoriesByChannelId } from '../shared/graphql/stories';

export class TchopGetStories implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Get Stories',
		name: 'tchopGetStories',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Get list of stories from a channel in tchop',
		defaults: {
			name: 'Tchop Get Stories',
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
				description: 'The ID of the channel to get stories from',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const channelId = this.getNodeParameter('channelId', i) as string;
				const responseData = await getStoriesByChannelId.call(this, parseInt(channelId, 10));
				const executionData = this.helpers.returnJsonArray(responseData as unknown as IDataObject[]);
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
