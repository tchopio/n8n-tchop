import { IExecuteFunctions } from 'n8n-workflow';
import { tchopGraphQLRequest } from '../../api/client';
import { GET_CHANNELS_QUERY } from './templates';
import { GetChannelsResult, Channel } from './models';

export async function getChannels(
	this: IExecuteFunctions,
): Promise<Channel[]> {
	const result = await tchopGraphQLRequest.call(
		this,
		GET_CHANNELS_QUERY,
	);
	return (result as GetChannelsResult).channels;
}
