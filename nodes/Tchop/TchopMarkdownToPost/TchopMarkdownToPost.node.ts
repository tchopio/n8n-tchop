import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';
import { markdownToPostBlocks } from '../shared/graphql/formatters';
import { uploadImageUrl } from '../api/upload';

export class TchopMarkdownToPost implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tchop: Markdown to Post',
		name: 'tchopMarkdownToPost',
		icon: 'file:../shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Convert markdown text to content blocks JSON for Tchop Create Post',
		defaults: {
			name: 'Tchop Markdown to Post',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'tchopApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Markdown',
				name: 'markdown',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				required: true,
				description: 'The markdown text to convert to content blocks',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'assignmentCollection',
				default: {},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const markdown = this.getNodeParameter('markdown', i) as string;
				const metadataParam = this.getNodeParameter('metadata', i, {}) as AssignmentCollectionValue;
				const meta: Record<string, string> = metadataParam?.assignments
					? (metadataParam.assignments as Array<{ name: string; value: string }>).reduce(
						(acc, { name, value }) => ({ ...acc, [name]: value }),
						{},
					)
					: {};

				const { blocks, imagePlaceholders } = markdownToPostBlocks(markdown);

				// Upload images and patch block data with returned IDs
				for (const [blockId, placeholder] of imagePlaceholders) {
					const response = await uploadImageUrl.call(this, { url: placeholder.imageUrl });
					const imageId = response.id as number;

					const block = blocks.find((b) => b.id === blockId);
					if (block) {
						block.data = {
							items: [{ image: { id: imageId }, caption: placeholder.caption }],
							stretched: false,
							withBackground: false,
							withBorder: false,
						};
					}
				}

				const executionData = this.helpers.returnJsonArray({
					contentBlocks: blocks,
					_meta: meta,
				} as unknown as IDataObject);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
