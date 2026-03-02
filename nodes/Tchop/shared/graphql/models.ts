export interface StoryCardPostInStoryInput {
	fields: StoryCardFieldsPostInStoryInput;
	storyId: number;
}

export interface StoryCardFieldsPostInStoryInput {
	articleFields?: StoryCardArticleFieldsPostInStoryInput;
	audioFields?: StoryCardAudioFieldsPostInStoryInput;
	categoryId?: number;
	editorialFields?: StoryCardEditorialFieldsPostInStoryInput;
	imageFields?: StoryCardImageFieldsPostInStoryInput;
	localeId?: number;
	mentionedUsersId?: number[];
	options?: StoryCardOptionsFieldsPostInStoryInput;
	organisationTags?: StoryCardOrganisationTagsPostInStoryInput;
	pdfFields?: StoryCardPdfFieldsPostInStoryInput;
	pollFields?: StoryCardPollFieldsPostInStoryInput;
	postFields?: StoryCardPostFieldsPostInStoryInput;
	postedAt?: string;
	postingTime?: string;
	quoteFields?: StoryCardQuoteFieldsPostInStoryInput;
	status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
	threadFields?: StoryCardThreadFieldsPostInStoryInput;
	videoFields?: StoryCardVideoFieldsPostInStoryInput;
}

// Post content fields for digest posts
export interface StoryCardPostFieldsPostInStoryInput {
	title?: string;
	headline?: string;
	abstract?: string;
	contentAuthor?: string;
	contentReadTime?: number;
	sourceName?: string;
	styles?: StoryCardPostStylesPostInStoryInput;
	gallery?: StoryCardToCreatePostGallery;
	contentBlocks: StoryCardPostContentBlockFieldsPostInStoryInput[];
}

export interface StoryCardPostContentBlockFieldsPostInStoryInput {
	id?: string;
	type: string; // e.g. 'header' | 'paragraph' | 'delimiter' | 'embed-link'
	data: Record<string, unknown>;
}

export interface StoryCardPostStylesPostInStoryInput { [key: string]: unknown }
export interface StoryCardToCreatePostGallery { [key: string]: unknown }

export interface StoryCardArticleFieldsPostInStoryInput {
	url: string;
	title?: string;
}

export interface StoryCardEditorialFieldsPostInStoryInput {
	headline?: string;
	text?: string;
}

export interface StoryCardThreadFieldsPostInStoryInput {
	title: string;
}

// Placeholder interfaces for other field types that could be expanded
export interface StoryCardAudioFieldsPostInStoryInput {
	gallery: StoryCardToCreateAudioGallery[];
	headline?: string;
	sourceName?: string;
	subHeadline?: string;
	text?: string;
}

export interface StoryCardToCreateAudioGallery {
	audio: StoryCardToCreateAudioGalleryAudioElement;
	image?: StoryCardToCreateGalleryImageElement;
	title?: string;
}

export interface StoryCardToCreateAudioGalleryAudioElement {
	id: number;
	useDefaultThumb?: boolean;
}

export interface StoryCardToCreateGalleryImageElement {
	id: number;
	rightholder?: string;
	statusCopyrightId?: string;
}
export interface StoryCardImageFieldsPostInStoryInput { [key: string]: unknown }
export interface StoryCardOptionsFieldsPostInStoryInput { [key: string]: unknown }
export interface StoryCardOrganisationTagsPostInStoryInput { [key: string]: unknown }
export interface StoryCardPdfFieldsPostInStoryInput { [key: string]: unknown }
export interface StoryCardPollFieldsPostInStoryInput { [key: string]: unknown }
export interface StoryCardQuoteFieldsPostInStoryInput {
	url: string;
	quotePerson: string;
	quotePersonHandle: string;
	quotePersonImage?: string;
	quoteCreated?: string;
	quoteSource: string;
	comment: string;
	text: string;
	images: Array<{ url: string; width?: number; height?: number; caption?: string }>;
}
export interface StoryCardVideoFieldsPostInStoryInput { [key: string]: unknown }

export interface StoryCardPostInStoryResult {
	storyCardPostInStory: {
		payload?: StoryCard;
		error?: StoryCardPostInStoryErrorResult;
	};
}

// Helper shapes for formatter
export type DigestBlock =
	| { type: 'header'; data: { text: string; level?: number } }
	| { type: 'paragraph'; data: { text: string } }
	| { type: 'delimiter'; data: Record<string, never> }
	| { type: 'embed-link'; data: { url: string; caption?: string } };

export interface StoryCard {
	id: string;
	type: string;
	storyId: number;
	content: StoryCardContent;
}

export type StoryCardContent =
	| StoryCardThreadContent
	| StoryCardEditorialContent
	| StoryCardArticleContent;

export interface StoryCardThreadContent {
	title: string;
}

export interface StoryCardEditorialContent {
	headline?: string;
	text?: string;
}

export interface StoryCardArticleContent {
	title?: string;
	url: string;
}

export interface StoryCardPostInStoryErrorResult {
	__typename: string;
	message?: string;
	details?: Array<{
		message: string;
		path: string[];
		type: string;
	}>;
}

export interface Channel {
	id: number;
	name: string;
	subdomain: string;
}

export interface GetChannelsResult {
	channels: Channel[];
}

export interface Story {
	id: number;
	title: string;
	subtitle?: string;
	cardsCount: number;
	status: string;
	isReadOnly: boolean;
}

export interface GetStoriesByChannelIdResult {
	storiesByChannelId: {
		items: Story[];
	};
}
