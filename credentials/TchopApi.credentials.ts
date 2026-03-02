import {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TchopApi implements ICredentialType {
	name = 'tchopApi';
	displayName = 'Tchop API';
	icon: Icon = 'file:icons/ic_tchop.svg';
	group = ['main'];
	description =
		'Use your Tchop API credentials to authenticate to the Tchop API. See https://tchop-staging.com/api/docs/#/ for more details.';
	documentationUrl = 'https://tchop-staging.com/api/docs#/';
	properties: INodeProperties[] = [
		{
			displayName: 'Organization Token',
			name: 'organisationToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'User Token',
			name: 'userToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://tchop-staging.com',
			required: true,
		},
		{
			displayName: 'Sub-domain',
			name: 'subDomain',
			type: 'string',
			default: '',
			description: 'Organisation sub-domain to target (e.g. myorg)',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.baseUrl}}/api/graphql/webapp',
			body: {
				query: 'query getCurrentUser{ me{ id } }',
			},
		},
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-tchop-app-id': 'io.tchop.dev',
				'x-tchop-app-platform': 'android',
				'x-tchop-app-version': '4.0.0',
				'x-tchop-app-organisation-token': '={{$credentials.organisationToken}}',
				'x-tchop-token': '={{$credentials.userToken}}',
				'x-tchop-webapp-organisation': '={{$credentials.subDomain}}',
				Cookie: '=mz-account={{$credentials.userToken}}',
			},
		},
	};
}
