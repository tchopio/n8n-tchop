import { DigestBlock, StoryCardPostContentBlockFieldsPostInStoryInput } from './models';

// Very small markdown subset -> blocks
// - # / ## heading -> header block { text, level }
// - --- or *** line -> delimiter block {}
// - bare URL line -> embed-link block { url }
// - everything else (non-empty) -> paragraph { text }
export function markdownToPostBlocks(
	markdown: string,
): StoryCardPostContentBlockFieldsPostInStoryInput[] {
	const lines = markdown.split(/\r?\n/);
	const blocks: StoryCardPostContentBlockFieldsPostInStoryInput[] = [];

	let blockCounter = 0;
	const getNextId = () => `b${Date.now()}-${blockCounter++}`;

	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;

		// Header h1/h2
		const m = line.match(/^(#{1,2})\s+(.*)$/);
		if (m) {
			const level = m[1].length; // 1 or 2
			blocks.push({ id: getNextId(), type: 'header', data: { text: m[2], level } });
			continue;
		}

		// Delimiter
		if (/^(\*\*\*|---)$/.test(line)) {
			blocks.push({ id: getNextId(), type: 'delimiter', data: {} });
			continue;
		}

		// Embed link: bare URL on its own line
		if (/^(https?:\/\/\S+)$/.test(line)) {
			blocks.push({ id: getNextId(), type: 'embed-link', data: { url: line } });
			continue;
		}

		// Paragraph (fallback)
		blocks.push({ id: getNextId(), type: 'paragraph', data: { text: line } });
	}

	return blocks;
}

export function toPostBlocks(
	blocks: DigestBlock[],
): StoryCardPostContentBlockFieldsPostInStoryInput[] {
	let blockCounter = 0;
	const getNextId = () => `b${Date.now()}-${blockCounter++}`;

	return blocks.map((b) => ({
		id: getNextId(),
		type: b.type,
		data: b.data as Record<string, unknown>,
	}));
}
