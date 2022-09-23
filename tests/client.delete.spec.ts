import mockAxios from 'jest-mock-axios';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: Delete Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        mockAxios.reset();

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('Delete function is called', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'delete'
        }, {
            data: 'test'
        }, true);

        xano.delete('/test');

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            headers: {},
            method: 'DELETE',
            params: undefined,
            url: '/test'
        });
    });

    test('Delete function is called with params', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'delete'
        }, {
            data: 'test'
        }, true);

        xano.delete('/test', {
            'a': 'b'
        });

        expect(mockAxios.request).toHaveBeenCalledWith({
            baseURL: apiGroupBaseUrl,
            data: '{"a":"b"}',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'DELETE',
            params: undefined,
            url: '/test'
        });
    });
});
