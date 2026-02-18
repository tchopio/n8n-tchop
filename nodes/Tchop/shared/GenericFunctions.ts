import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

export async function tchopApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('tchopApi');
	const baseUrl = (credentials.baseUrl as string || 'https://tchop-staging.com').replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method,
		body,
		qs: query,
		url: `${baseUrl}${endpoint}`,
		headers: {
			'x-tchop-app-id': 'io.tchop.dev',
			'x-tchop-app-platform': 'android',
			'x-tchop-app-version': '4.0.0',
			'x-tchop-app-organisation-token': credentials.organisationToken as string,
			'x-tchop-token': credentials.userToken as string,
		},
		json: true,
	};

	return await this.helpers.httpRequest(options);
}
