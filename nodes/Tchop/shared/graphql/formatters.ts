import { StoryCardPostContentBlockFieldsPostInStoryInput } from './models';

type Block = StoryCardPostContentBlockFieldsPostInStoryInput;

let blockCounter = 0;
function nextId(): string {
	return `b${Date.now()}-${blockCounter++}`;
}

/**
 * Convert inline markdown to HTML for mobile rendering
 * (NSAttributedString on iOS, Spanned/Spannable on Android).
 *
 *   **bold** / __bold__       ->  <b>…</b>
 *   *italic* / _italic_       ->  <i>…</i>
 *   ~~strikethrough~~         ->  <s>…</s>
 *   [text](url)               ->  <a href="url">text</a>
 *   `code`                    ->  <code>…</code>
 */
function inlineMarkdown(text: string): string {
	return (
		text
			// links first so []() isn't mangled by bold/italic
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
			// inline code before bold/italic so backtick contents aren't touched
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			// strikethrough
			.replace(/~~(.+?)~~/g, '<s>$1</s>')
			// bold  **text** or __text__
			.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
			.replace(/__(.+?)__/g, '<b>$1</b>')
			// italic  *text* or _text_
			.replace(/(?<!\*)\*([^\s*](?:.*?[^\s*])?)\*(?!\*)/g, '<i>$1</i>')
			.replace(/(?<!_)_([^\s_](?:.*?[^\s_])?)_(?!_)/g, '<i>$1</i>')
	);
}

/**
 * Parse a list item line, returning its text content.
 * Supports:  - item, * item, + item, 1. item, 2) item
 */
function parseListLine(line: string): { text: string } | null {
	const m = line.match(/^(\s*)(?:[-*+]|\d+[.)]) (.*)$/);
	if (!m) return null;
	return { text: m[2] };
}

function isOrderedListLine(line: string): boolean {
	return /^\s*\d+[.)] /.test(line);
}

function consumeList(
	lines: string[],
	start: number,
): { block: Block; next: number } {
	const firstLine = lines[start];
	const style = isOrderedListLine(firstLine) ? 'ordered' : 'unordered';
	const items: Array<{ content: string; items: Record<string, unknown>[] }> = [];
	let i = start;

	while (i < lines.length) {
		const parsed = parseListLine(lines[i]);
		if (!parsed) break;
		items.push({ content: inlineMarkdown(parsed.text), items: [] });
		i++;
	}

	return {
		block: { id: nextId(), type: 'list', data: { items, style } },
		next: i,
	};
}

function consumeBlockquote(
	lines: string[],
	start: number,
): { block: Block; next: number } {
	const parts: string[] = [];
	let i = start;

	while (i < lines.length) {
		const m = lines[i].match(/^>\s?(.*)$/);
		if (!m) break;
		parts.push(m[1]);
		i++;
	}

	return {
		block: {
			id: nextId(),
			type: 'quote',
			data: { text: inlineMarkdown(parts.join('<br>')), caption: '', alignment: 'left' },
		},
		next: i,
	};
}

function consumeCodeBlock(
	lines: string[],
	start: number,
): { block: Block; next: number } {
	const codeParts: string[] = [];
	let i = start + 1; // skip opening fence

	while (i < lines.length) {
		if (lines[i].trimEnd() === '```') {
			i++; // skip closing fence
			break;
		}
		codeParts.push(lines[i]);
		i++;
	}

	return {
		block: { id: nextId(), type: 'code', data: { code: codeParts.join('\n') } },
		next: i,
	};
}

/**
 * Image block placeholder. The `imageUrl` field signals that the caller
 * must upload this URL and replace the data with `{ image: { id }, caption }`.
 */
export interface ImagePlaceholder {
	imageUrl: string;
	caption: string;
}

/**
 * Convert markdown string to an array of Tchop content blocks.
 *
 * Text content uses HTML for inline formatting (rendered via
 * NSAttributedString on iOS and Spannable on Android).
 *
 * Supported elements:
 *   # / ## / ### headings        -> header  { text, level }
 *   --- or ***                   -> delimiter {}
 *   > blockquote (multi-line)    -> quote   { text, caption, alignment }
 *   ```fenced code```            -> code    { code }
 *   - / * / + unordered list     -> list    { items, style:'unordered' }
 *   1. ordered list              -> list    { items, style:'ordered' }
 *   ![alt](url)                  -> image   { imageUrl, caption } (placeholder for upload)
 *   bare URL on own line         -> embed-link { url, caption }
 *   everything else              -> paragraph  { text } with inline HTML
 *
 * Consecutive plain-text lines are merged into a single paragraph.
 *
 * Returns { blocks, imagePlaceholders } — the caller is responsible for
 * uploading images and patching the block data.
 */
export function markdownToPostBlocks(markdown: string): {
	blocks: Block[];
	imagePlaceholders: Map<string, ImagePlaceholder>;
} {
	blockCounter = 0;
	const lines = markdown.split(/\r?\n/);
	const blocks: Block[] = [];
	const imagePlaceholders = new Map<string, ImagePlaceholder>();
	let i = 0;

	let paragraphBuffer: string[] = [];
	function flushParagraph(): void {
		if (paragraphBuffer.length === 0) return;
		const text = inlineMarkdown(paragraphBuffer.join(' '));
		blocks.push({ id: nextId(), type: 'paragraph', data: { text } });
		paragraphBuffer = [];
	}

	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();

		// Empty line: flush paragraph buffer
		if (!trimmed) {
			flushParagraph();
			i++;
			continue;
		}

		// Fenced code block
		if (trimmed.startsWith('```')) {
			flushParagraph();
			const result = consumeCodeBlock(lines, i);
			blocks.push(result.block);
			i = result.next;
			continue;
		}

		// Header h1-h3
		const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
		if (headerMatch) {
			flushParagraph();
			const level = headerMatch[1].length;
			blocks.push({
				id: nextId(),
				type: 'header',
				data: { text: inlineMarkdown(headerMatch[2]), level },
			});
			i++;
			continue;
		}

		// Delimiter
		if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
			flushParagraph();
			blocks.push({ id: nextId(), type: 'delimiter', data: {} });
			i++;
			continue;
		}

		// Blockquote
		if (trimmed.startsWith('>')) {
			flushParagraph();
			const result = consumeBlockquote(lines, i);
			blocks.push(result.block);
			i = result.next;
			continue;
		}

		// List (unordered or ordered)
		if (parseListLine(line) !== null) {
			flushParagraph();
			const result = consumeList(lines, i);
			blocks.push(result.block);
			i = result.next;
			continue;
		}

		// Image: ![alt](url)
		const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
		if (imgMatch) {
			flushParagraph();
			const blockId = nextId();
			const placeholder: ImagePlaceholder = {
				imageUrl: imgMatch[2],
				caption: imgMatch[1],
			};
			imagePlaceholders.set(blockId, placeholder);
			// Temporary data — will be patched after upload
			blocks.push({
				id: blockId,
				type: 'image',
				data: {
					items: [],
					stretched: false,
					withBackground: false,
					withBorder: false,
				},
			});
			i++;
			continue;
		}

		// Bare URL on its own line -> embed-link
		if (/^https?:\/\/\S+$/.test(trimmed)) {
			flushParagraph();
			blocks.push({
				id: nextId(),
				type: 'embed-link',
				data: { url: trimmed, caption: '' },
			});
			i++;
			continue;
		}

		// Default: accumulate as paragraph text
		paragraphBuffer.push(trimmed);
		i++;
	}

	flushParagraph();
	return { blocks, imagePlaceholders };
}
