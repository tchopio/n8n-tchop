import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export interface UploadFileParams {
	file: Buffer | ReadableStream;
	template?: string;
	type: 'image' | 'audio';
}

export interface UploadResponse {
	id?: number;
	url?: string;
	[key: string]: unknown;
}

/**
 * Base function to upload a file to Tchop FS service.
 */
async function uploadFile(
	this: IExecuteFunctions,
	params: UploadFileParams,
): Promise<UploadResponse> {
	const { file, template = 'item', type } = params;

	const credentials = await this.getCredentials('tchopApi');
	const baseUrl = ((credentials.baseUrl as string) || 'https://tchop-staging.com').replace(
		/\/$/,
		'',
	);
	const organisation = credentials.subDomain as string;
	const uploadUrl = `${baseUrl}/api/fs/upload/${type}`;
	// const uploadUrl = `https://bin.kitechs.xyz/a1d51de1-d67b-41fc-9417-48cbd59b1542/api/fs/upload/${type}`;

	const filename = Math.random().toString(36).substring(7);
	const contentType = type === 'image' ? 'image/*' : 'audio/*';

	const formData = new FormData();
	console.log('params: ', params);
	if (file instanceof Buffer) {
		const blob = new Blob([new Uint8Array(file)], { type: contentType });
		formData.append('file', blob, filename);
	} else {
		const response = new Response(file);
		const blob = await response.blob();
		formData.append('file', blob, filename);
	}

	if (template) {
		formData.append('template', template);
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		qs: { organisation },
		// @ts-ignore
		body: formData,
		url: uploadUrl,
	};

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'tchopApi', options,);
		return response as UploadResponse;
	} catch (e) {
		console.error(`${type} upload failed:`, e.response?.data || e.message);
		throw e;
	}
}

/**
 * Just upload image file and return id
 */
export async function uploadImageFile(
	this: IExecuteFunctions,
	params: {
		file: Buffer;
		template?: string;
	},
): Promise<UploadResponse> {
	return uploadFile.call(this, { ...params, type: 'image' });
}

/**
 * Download URL and call upload file
 */
export async function uploadImageUrl(
	this: IExecuteFunctions,
	params: {
		url: string;
		template?: string;
	},
): Promise<UploadResponse> {
	const downloadResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: params.url,
		encoding: 'arraybuffer',
		returnFullResponse: true,
	});

	const uploadFileBuffer = downloadResponse.body as Buffer;

	return uploadFile.call(this, {
		file: uploadFileBuffer,
		template: params.template,
		type: 'image',
	});
}

/**
 * Just upload audio file and return id
 */
export async function uploadAudioFile(
	this: IExecuteFunctions,
	params: {
		file: Buffer;
	},
): Promise<UploadResponse> {
	return uploadFile.call(this, { ...params, type: 'audio' });
}

/**
 * Download and upload audio
 */
export async function uploadAudioUrl(
	this: IExecuteFunctions,
	params: {
		url: string;
	},
): Promise<UploadResponse> {
	console.log("upload audio", params);
	const downloadResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: params.url,
		encoding: 'arraybuffer',
		returnFullResponse: true,
	});

	const uploadFileBuffer = downloadResponse.body as Buffer;
	console.log('audio downloaded', params);
	return uploadFile.call(this, {
		file: uploadFileBuffer,
		type: 'audio',
	});
}

export interface UploadImageParams {
	url?: string; // URL of the image to download and upload
	file?: Buffer; // OR binary content of the file
	template?: string; // e.g. "item", "avatar", etc.
}

export interface UploadImageResponse extends UploadResponse {}

/**
 * Upload an image to Tchop FS service.
 * Handles both URL-based images and raw Buffer content.
 * @deprecated Use uploadImageFile or uploadImageUrl instead
 */
export async function uploadImage(
	this: IExecuteFunctions,
	params: UploadImageParams,
): Promise<UploadImageResponse> {
	if (params.file) {
		return uploadImageFile.call(this, {
			file: params.file,
			template: params.template,
		});
	} else if (params.url) {
		return uploadImageUrl.call(this, {
			url: params.url,
			template: params.template,
		});
	} else {
		throw new Error('No file content or URL provided for image upload');
	}
}
