/* eslint-disable */
import { IHttpRequestOptions } from 'n8n-workflow';
import { uploadImageFileFromUrl } from '../nodes/Tchop/api/upload_image_file_from_url';

async function test() {
    const imageUrl = 'https://picsum.photos/id/760/64/64';
    const organisation = 'quantum';

    // Mock n8n context
    const context = {
        getCredentials: async (type: string) => {
            if (type === 'tchopApi') {
                return {
                    baseUrl: 'https://tchop-staging.com',
                    organisationToken: 'aae48bbec222d7c7b4a3bf38cff9dfeb6e62e4f1', // from curl example
                    userToken: 'aae48bbec222d7c7b4a3bf38cff9dfeb6e62e4f1', // from curl example
                };
            }
            return {};
        },
        helpers: {
            httpRequest: async (options: IHttpRequestOptions) => {
                console.log('--- httpRequest call ---');
                console.log('URL:', options.url);
                console.log('Method:', options.method);
                if (options.qs) {
                    console.log('Query:', JSON.stringify(options.qs));
                }
                
                if (options.method === 'GET') {
                    const res = await fetch(options.url as string);
                    const buffer = await res.arrayBuffer();
                    return {
                        body: Buffer.from(buffer),
                        headers: {
                            'content-type': res.headers.get('content-type')
                        }
                    };
                }

                if (options.method === 'POST') {
                    // We need to handle FormData correctly here since we are using fetch
                    const FormData = (await import('form-data')).default;
                    const form = new FormData();
                    
                    const opts = options as any;
                    if (opts.formData) {
                        for (const key of Object.keys(opts.formData)) {
                            const val = opts.formData[key];
                            if (typeof val === 'object' && val.value) {
                                form.append(key, val.value, val.options);
                            } else {
                                form.append(key, val);
                            }
                        }
                    }

                    let url = options.url as string;
                    if (options.qs) {
                        const searchParams = new URLSearchParams();
                        for (const key of Object.keys(options.qs)) {
                            searchParams.append(key, (options.qs as any)[key]);
                        }
                        url += '?' + searchParams.toString();
                    }

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            ...options.headers,
                            ...form.getHeaders(),
                        } as any,
                        body: form as any,
                    });
                    const text = await res.text();
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        return text;
                    }
                }
                
                return {};
            }
        }
    };

    try {
        console.log('Starting upload test...');
        const result = await uploadImageFileFromUrl.call(context as any, {
            url: imageUrl,
            organisation,
        });
        console.log('Upload Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
