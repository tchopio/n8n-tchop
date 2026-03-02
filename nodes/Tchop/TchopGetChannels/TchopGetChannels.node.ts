import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { getChannels } from '../shared/graphql/channels';

export class TchopGetChannels implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Get Channels',
		name: 'tchopGetChannels',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Get list of channels from tchop',
		defaults: {
			name: 'Tchop Get Channels',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'tchopApi',
				required: true,
			},
		],
		properties: [],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const responseData = await getChannels.call(this);
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
