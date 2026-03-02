import { IDataObject } from 'n8n-workflow';

export function sanitizeStoryItem(item: IDataObject): IDataObject {
	const result: IDataObject = {
		id: item.id,
		postedTime: item.postedTime,
		type: item.type,
		created: item.created,
		updated: item.updated,
		title: item.title,
		url: item.url,
		sourceName: item.sourceName,
		headline: item.headline,
		abstract: item.abstract,
		contentAuthor: item.contentAuthor,
		contentReadTime: item.contentReadTime,
		storyId: item.storyId,
		position: item.position,
		commentsCount: item.commentsCount,
	};

	if (item.author) {
		const author = item.author as IDataObject;
		result.author = {
			name: author.name,
			initials: author.initials,
		};
	}

	if (item.image) {
		const image = item.image as IDataObject;
		result.image = {
			url: image.url,
		};
	}

	return result;
}
