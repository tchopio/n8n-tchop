import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TchopApi implements ICredentialType {
	name = 'tchopApi';
	displayName = 'tchop API';
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
	];
}
