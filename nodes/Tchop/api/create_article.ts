import { CreatePostInput } from './inputs';
import { STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION } from '../shared/graphql/templates';
import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { StoryCardPostInStoryResult } from '../shared/graphql/models';
import { uploadImageUrl } from './upload';
import { tchopGraphQLRequest } from './client';

export interface CreateArticlePostInput extends CreatePostInput {
	source: string;
	title: string;
	description?: string;
	image?: string;
	url: string;
	author?: string;
	style?: string;
}

interface ArticleInput {
	storyId: number;
	fields: {
		articleFields: {
			headline?: string;
			sourceName: string;
			title: string;
			abstract?: string;
			url: string;
			gallery: [
				{
					image: { id: number };
				},
			];
			styles?: {
				teaserImageStyle: string;
			};
			contentAuthor?: string;
		};
		status: 'PUBLISHED' | 'DRAFTED';
	};
}

const MUTATION = STORY_CARD_POST_IN_STORY_POST_FIELDS_MUTATION;

export async function createArticlePost(
	this: IExecuteFunctions,
	params: CreateArticlePostInput,
): Promise<StoryCardPostInStoryResult> {
	const gallery: Array<{ image: { id: number } }> = [];
	if (params.image) {
		const response = await uploadImageUrl.call(this, {
			url: params.image,
		});
		const imageId = response.id as number;
		gallery.push({ image: { id: imageId } });
	}
	const input: ArticleInput = {
		storyId: params.storyId,
		fields: {
			articleFields: {
				headline: params.headline,
				sourceName: params.source,
				title: params.title,
				abstract: params.description,
				url: params.url,
				gallery: gallery as [{ image: { id: number } }],
				styles: params.style ? { teaserImageStyle: params.style } : undefined,
				contentAuthor: params.author,
			},
			status: params.published ? 'PUBLISHED' : 'DRAFTED',
		},
	};
	const response = await tchopGraphQLRequest.call(this, MUTATION, {
		input,
	} as unknown as IDataObject);
	return response as StoryCardPostInStoryResult;
}
