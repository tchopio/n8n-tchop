import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { tchopGraphQLRequest } from '../../api/client';
import { STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION } from './templates';
import {
	StoryCardPostInStoryResult,
	StoryCardPostInStoryInput,
	StoryCardPostFieldsPostInStoryInput,
	StoryCardPostContentBlockFieldsPostInStoryInput,
} from './models';

export type DigestCreateParams = {
	storyId: number;
	title: string;
	headline?: string;
	sourceName?: string;
	abstract?: string; // description
	contentBlocks?: StoryCardPostContentBlockFieldsPostInStoryInput[];
	status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
};

export async function createDigestPost(
	this: IExecuteFunctions,
	params: DigestCreateParams,
): Promise<StoryCardPostInStoryResult> {
	const {
		storyId,
		title,
		headline,
		sourceName,
		abstract,
		contentBlocks = [],
		status = 'PUBLISHED',
	} = params;

	const fields: StoryCardPostFieldsPostInStoryInput = {
		title,
		headline: headline,
		sourceName: sourceName || 'n8n',
		abstract,
		contentBlocks,
	};

	const input: StoryCardPostInStoryInput = {
		storyId,
		fields: {
			postFields: fields,
			status,
		},
	};
	const result = await tchopGraphQLRequest.call(
		this,
		STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION,
		{ input } as unknown as IDataObject,
	);
	return result as StoryCardPostInStoryResult;
}
