import mockAxios from 'jest-mock-axios';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: PUT Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        mockAxios.reset();

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('PUT function is called', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'put'
        }, {
            data: 'test'
        }, true);

        xano.put('/test');

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'PUT',
            params: undefined,
            url: '/test'
        });
    });

    test('PUT function is called with params', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'put'
        }, {
            data: 'test'
        }, true);

        xano.put('/test', {
            'a': 'b'
        });

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            data: '{"a":"b"}',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            params: undefined,
            url: '/test'
        });
    });
});
