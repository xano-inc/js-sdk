import mockAxios from 'jest-mock-axios';
import { XanoContentType } from '../src/enums/content-type';
import { XanoFile } from '../src/models/file';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { XanoRequestError } from '../src/errors/request';
import { XanoResponse } from '../src/models/response';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';
    const mockXanoFile = new XanoFile('test.csv', Buffer.from('Welcome'));

    let xano: XanoClient;

    beforeEach(() => {
        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('hasAuthToken to be false', () => {
        expect((<any>xano).hasAuthToken()).toBeFalsy();
    });

    test('hasAuthToken to be true', () => {
        xano.setAuthToken('abc');

        expect((<any>xano).hasAuthToken()).toBeTruthy();
    });

    test('setAuthToken updates config', () => {
        expect((<any>xano).config.authToken).toEqual(null);
        const resp = xano.setAuthToken('abc');
        expect(resp instanceof XanoClient).toBeTruthy();
        expect((<any>xano).config.authToken).toEqual('abc');
    });

    test('Request includes auth token', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test'
        }, true);

        const bearerToken = 'laksdjfasdf';

        xano.setAuthToken(bearerToken);
        xano.get('/test');

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            },
            method: 'GET',
            params: undefined,
            url: '/test'
        });
    });

    test('File upload includes multipart header', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'post'
        }, {
            data: 'test'
        }, true);

        xano.post('/test', {
            file: mockXanoFile
        });

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('POST');
        expect(req.config.headers['Content-Type']).toEqual(XanoContentType.Multipart);
    });

    test('200 should trigger XanoResponse', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test',
            status: 200
        }, true);

        xano.get('/test').then(
            (response) => {
                expect((response instanceof XanoResponse)).toBeTruthy();
            },
            (error) => {
                fail('Error response should have been triggered on success');
            }
        );
    });

    test('404 error should trigger XanoRequestError', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test',
            status: 404
        }, true);

        xano.get('/test').then(
            (response) => {
                fail('Successful response should have been triggered an error');
            },
            (error) => {
                expect((error instanceof XanoRequestError)).toBeTruthy()
            }
        );
    });

    test('buildFormData with simple object', () => {
        const simpleObject = {
            'a': 'b',
            'c': 'd'
        };

        const ret = (<any>xano).buildFormData(simpleObject);

        expect(ret.hasFile).toBeFalsy();
        expect(ret.rawFormData).toEqual(simpleObject);
    });

    test('buildFormData with nested object', () => {
        const nestedObject = {
            'a': 'b',
            'c': {
                'd': 'e',
                'f': {
                    'g': 'h'
                }
            }
        };

        const expectedObject = {
            'a': 'b',
            'c': '{\"d\":\"e\",\"f\":{\"g\":\"h\"}}'
        };

        const ret = (<any>xano).buildFormData(nestedObject);

        expect(ret.hasFile).toBeFalsy();
        expect(ret.rawFormData).toEqual(expectedObject);
    });

    test('buildFormData with mock file to check hasFile', () => {
        const simpleObject = {
            'a': 'b',
            'c': mockXanoFile
        };

        const ret = (<any>xano).buildFormData(simpleObject);

        expect(ret.hasFile).toBeTruthy();
    });

    test('isFileType should be falsy', () => {
        const falsyTypes = [
            '',
            'a',
            null,
            undefined,
            ' '
        ];

        falsyTypes.forEach((type) => {
            expect((<any>xano).isFileType(type)).toBeFalsy();
        });
    });

    test('isFileType should be true on XanoFile', () => {
        expect((<any>xano).isFileType(mockXanoFile)).toBeTruthy();
    });

    test('isFileType should be true on File', () => {
        const file = new File([], 'test.csv');

        expect((<any>xano).isFileType(file)).toBeTruthy();
    });
});
