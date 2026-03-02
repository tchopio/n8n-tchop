import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { tchopGraphQLRequest } from '../../api/client';
import { STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION } from './templates';
import {
	StoryCardPostInStoryResult,
	StoryCardPostInStoryInput,
	StoryCardQuoteFieldsPostInStoryInput,
} from './models';

export type SocialCreateParams = {
	storyId: number;
	headline?: string;
	text?: string;
	imageUrls?: string[];
	status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
};

export async function createSocialPost(
	this: IExecuteFunctions,
	params: SocialCreateParams,
): Promise<StoryCardPostInStoryResult> {
	const {
		storyId,
		headline,
		text = '',
		imageUrls = [],
		status = 'PUBLISHED',
	} = params;

	// Construct quoteFields as the default way to create "Social Posts"
	const quoteFields: StoryCardQuoteFieldsPostInStoryInput = {
		url: '', // optional placeholder when no external URL
		quotePerson: 'n8n',
		quotePersonHandle: '@n8n',
		quoteSource: 'n8n',
		comment: headline || '',
		text: text,
		images: imageUrls.map((url) => ({ url })),
	};

	const fields = {
		status,
		quoteFields,
	};

	const input: StoryCardPostInStoryInput = {
		storyId,
		fields,
	};
	const result = await tchopGraphQLRequest.call(
		this,
		STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION,
		{ input } as unknown as IDataObject,
	);
	return result as StoryCardPostInStoryResult;
}
