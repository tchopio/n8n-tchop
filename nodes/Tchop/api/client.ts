import { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export function buildTchopHeaders(credentials: IDataObject): Record<string, string> {
	const subDomain = (credentials.subDomain as string) || '';
	const userToken = (credentials.userToken as string) || '';
	const organisationToken = (credentials.organisationToken as string) || '';

	return {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'Authorization': userToken ? `Bearer ${userToken}` : '',
		'x-tchop-app-organisation-token': organisationToken,
		'x-tchop-token': userToken,
		'x-tchop-webapp-organisation': subDomain || 'quantum',
		'Cookie': userToken ? `mz-account=${userToken}` : '',
	};
}

export async function tchopGraphQLRequest<T = unknown>(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	query: string,
	variables: IDataObject = {},
): Promise<T> {
	const credentials = await this.getCredentials('tchopApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
	const url = `${baseUrl}/api/graphql/webapp`;

	const headers = buildTchopHeaders(credentials as unknown as IDataObject);

	const body = {
		query,
		variables,
	};

	try {
		const response = await this.helpers.httpRequest({ url, method: 'POST', headers, body });
		const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;

		if (parsedResponse.errors && parsedResponse.errors.length > 0 && !parsedResponse.data) {
			throw new Error(`GraphQL Error: ${parsedResponse.errors.map((e: { message: string }) => e.message).join(', ')}`);
		}
		return parsedResponse.data as T;
	} catch (error) {
		if (error.response && error.response.body) {
			const errorData = typeof error.response.body === 'string' ? JSON.parse(error.response.body) : error.response.body;

			if (errorData.errors) {
				throw new Error(`GraphQL Error: ${errorData.errors.map((e: { message: string }) => e.message).join(', ')}`);
			}
		}
		throw error;
	}
}
