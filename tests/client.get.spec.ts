import mockAxios from 'jest-mock-axios';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: GET Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        mockAxios.reset();

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('GET function is called', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test'
        }, true);

        xano.get('/test');

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'GET',
            params: undefined,
            url: '/test'
        });
    });

    test('GET function is called with params', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test'
        }, true);

        xano.get('/test', {
            'a': 'b'
        });

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'GET',
            params: {
                'a': 'b'
            },
            url: '/test'
        });
    });
});
