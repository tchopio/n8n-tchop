import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { AssignmentCollectionValue } from 'n8n-workflow/dist/esm/interfaces';

export class ArticleSummarizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Article Summarizer',
		name: 'articleSummarizer',
		icon: 'file:../../Tchop/shared/icons/tchop.svg',
		group: ['transform'],
		version: 1,
		description: 'Receive web page url and make short summary using OpenAI',
		defaults: {
			name: 'Article Summarizer',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'openAIExpressApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'The URL of the web page to summarize',
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
		const credentials = await this.getCredentials('openAIExpressApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const url = this.getNodeParameter('url', i) as string;
				const metadataParam = this.getNodeParameter('metadata', i, {}) as AssignmentCollectionValue;
				const userMeta: Record<string, string> = (metadataParam as any)?.assignments
					? (metadataParam.assignments as Array<{ name: string; value: string }>).reduce(
						(acc, { name, value }) => ({ ...acc, [name]: value }),
						{},
					)
					: {};

				// 1. Fetch the page content
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					},
				});

				// 2. Simple text extraction (stripping HTML tags)
				// Note: For better results, a library like 'jsdom' or 'cheerio' would be better,
				// but we stick to basic implementation if possible or use a simple regex for now.
				const bodyContent = response.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || response;
				const cleanText = bodyContent
					.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
					.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
					.replace(/<[^>]+>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
					.substring(0, 4000); // Limit text sent to OpenAI

				// 3. Summarize with OpenAI
				const openAiResponse = (await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://api.openai.com/v1/chat/completions',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${credentials.apiKey}`,
					},
					body: {
						model: 'gpt-3.5-turbo',
						messages: [
							{
								role: 'system',
								content: 'You are a helpful assistant that summarizes web articles.',
							},
							{
								role: 'user',
								content: `Please provide a short summary of the following text:\n\n${cleanText}`,
							},
						],
						max_tokens: 250,
					},
				})) as any;

				const summary = openAiResponse.choices[0].message.content;

				returnData.push({
					json: {
						url,
						summary,
						_meta: userMeta,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
