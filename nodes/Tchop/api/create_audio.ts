import { CreatePostInput } from './inputs';
import { STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION } from '../shared/graphql/templates';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { StoryCardPostInStoryResult } from '../shared/graphql/models';
import { uploadAudioUrl, uploadImage } from './upload';
import { tchopGraphQLRequest } from './client';

const MUTATION = STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION;

export interface CreateAudioPostInput extends CreatePostInput {
	audioUrl: string;
	title?: string;
	headline?: string;
	subHeadline?: string;
	text?: string;
	sourceName?: string;
	imageUrl?: string;
}

export async function createAudioPost(
	this: IExecuteFunctions,
	params: CreateAudioPostInput,
): Promise<StoryCardPostInStoryResult> {
	// 1. Upload Audio
	const audioResponse = (await uploadAudioUrl.call(this, {
		url: params.audioUrl,
	})) as IDataObject;

	if (!audioResponse || !audioResponse.id) {
		throw new Error('Failed to upload audio file');
	}
	const audioId = audioResponse.id as number;

	// 2. Upload Image (optional)
	let imageId: number | undefined;
	if (params.imageUrl) {
		const imageResponse = (await uploadImage.call(this, {
			url: params.imageUrl,
		})) as IDataObject;
		if (imageResponse && imageResponse.id) {
			imageId = imageResponse.id as number;
		}
	}

	const input = {
		storyId: params.storyId,
		fields: {
			audioFields: {
				gallery: [
					{
						audio: {
							id: audioId,
						},
						image: imageId ? { id: imageId } : undefined,
						title: params.title || '',
					},
				],
				headline: params.headline || '',
				subHeadline: params.subHeadline || '',
				sourceName: params.sourceName || '',
				text: params.text || '',
			},
			status: params.published ? 'PUBLISHED' : 'DRAFTED',
		},
	};

	const response = await tchopGraphQLRequest.call(this, MUTATION, {
		input,
	} as unknown as IDataObject);
	return response as StoryCardPostInStoryResult;
}
