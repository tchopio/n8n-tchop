import { CreatePostInput } from './inputs';
import { STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION } from '../shared/graphql/templates';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { StoryCardPostInStoryResult } from '../shared/graphql/models';
import { uploadImage } from './upload';
import { tchopGraphQLRequest } from './client';

const MUTATION = STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION;

// Map a social URL to a quoteSource enum value expected by the API
function mapQuoteSource(url: string | undefined): 'BSKY' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'X' | 'n8n' {
	if (!url) return 'n8n';
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase();
		if (host.includes('bsky.app')) return 'BSKY';
		if (host.includes('instagram.com')) return 'INSTAGRAM';
		if (host.includes('tiktok.com')) return 'TIKTOK';
		if (host.includes('facebook.com') || host === 'fb.com' || host.endsWith('.fb.com') || host.startsWith('m.facebook.com')) return 'FACEBOOK';
		if (host.includes('x.com') || host.includes('twitter.com') || host === 't.co') return 'X';
		return 'n8n';
	} catch {
		return 'n8n';
	}
}

export interface CreateSocialPostInput extends CreatePostInput {
	quotePerson: string; // social post author name
	quotePersonHandle: string; // social post author nickname
	quotePersonImage?: string; // social post author avatar (URL)
	quoteCreated?: string; // social post create date
	url: string; // link to social post
	text?: string; // text in social post
	imageUrls?: string[]; // images in social post (URLs)
}

export async function createSocialPost(
	this: IExecuteFunctions,
	params: CreateSocialPostInput,
): Promise<StoryCardPostInStoryResult> {
	let quotePersonImageId: number | undefined;
	if (params.quotePersonImage) {
		const response = (await uploadImage.call(this, {
			url: params.quotePersonImage,
			template: 'profile',
		})) as IDataObject;
		if (response && response.id) {
			quotePersonImageId = response.id as number;
		}
	}

	const imageIds: number[] = [];
	if (params.imageUrls && params.imageUrls.length > 0) {
		for (const imageUrl of params.imageUrls) {
			const response = (await uploadImage.call(this, {
				url: imageUrl,
			})) as IDataObject;
			if (response && response.id) {
				imageIds.push(response.id as number);
			}
		}
	}

	const input = {
		storyId: params.storyId,
		fields: {
			quoteFields: {
				url: params.url,
				quotePerson: params.quotePerson,
				quotePersonHandle: params.quotePersonHandle,
				quotePersonImageId,
				quoteCreated: params.quoteCreated,
				quoteSource: mapQuoteSource(params.url), // enum BSKY, FACEBOOK, INSTAGRAM, TIKTOK, X
				headline: params.headline || '',
				quote: params.text || '',
				gallery: (imageIds || []).map((id) => ({
					image: { id },
				})),
			},
			status: params.published ? 'PUBLISHED' : 'DRAFTED',
		},
	};

	const response = await tchopGraphQLRequest.call(this, MUTATION, {
		input,
	} as unknown as IDataObject);
	return response as StoryCardPostInStoryResult;
}
