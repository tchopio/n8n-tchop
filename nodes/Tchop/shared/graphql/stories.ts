import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { tchopGraphQLRequest } from '../../api/client';
import { GET_STORIES_BY_CHANNEL_ID_QUERY } from './templates';
import { GetStoriesByChannelIdResult, Story } from './models';

export async function getStoriesByChannelId(
	this: IExecuteFunctions,
	channelId: number,
): Promise<Story[]> {
	const variables: IDataObject = {
		channelId,
	};
	const result = await tchopGraphQLRequest.call(
		this,
		GET_STORIES_BY_CHANNEL_ID_QUERY,
		variables,
	);
	return (result as GetStoriesByChannelIdResult).storiesByChannelId.items;
}
