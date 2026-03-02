import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import { tchopGraphQLRequest } from '../api/client';
import { STORY_CARD_DELETE_MUTATION } from '../shared/graphql/templates';

interface StoryCardDeleteResult {
	storyCardDelete: {
		payload?: boolean;
		error?: {
			__typename: string;
			message: string;
			kind?: string;
		};
	};
}

export class TchopDeleteItem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Delete Item',
		name: 'tchopDeleteItem',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Delete a story card item from a story',
		defaults: {
			name: 'Tchop Delete Item',
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
				displayName: 'Story Card ID',
				name: 'storyCardId',
				type: 'number',
				default: 0,
				required: true,
				description: 'The ID of the story card to delete',
			},
			{
				displayName: 'Story ID',
				name: 'storyId',
				type: 'number',
				default: 0,
				required: true,
				description: 'The ID of the story that contains the card',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const storyCardId = this.getNodeParameter('storyCardId', i) as number;
				const storyId = this.getNodeParameter('storyId', i) as number;

				const response = await tchopGraphQLRequest.call(
					this,
					STORY_CARD_DELETE_MUTATION,
					{ input: { storyCardId, storyId } } as unknown as IDataObject,
				);

				const result = response as unknown as StoryCardDeleteResult;
				const { payload, error } = result.storyCardDelete;

				if (error) {
					throw new NodeOperationError(
						this.getNode(),
						`${error.__typename}: ${error.message}`,
					);
				}

				const executionData = this.helpers.returnJsonArray({
					success: payload,
					storyCardId,
					storyId,
				} as unknown as IDataObject);
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
