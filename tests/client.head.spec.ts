import mockAxios from 'jest-mock-axios';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: HEAD Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        mockAxios.reset();

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('HEAD function is called', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'head'
        }, {
            data: 'test'
        }, true);

        xano.head('/test');

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'HEAD',
            params: undefined,
            url: '/test'
        });
    });

    test('HEAD function is called with params', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'head'
        }, {
            data: 'test'
        }, true);

        xano.head('/test', {
            'a': 'b'
        });

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'HEAD',
            params: {
                'a': 'b'
            },
            url: '/test'
        });
    });
});
