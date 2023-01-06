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

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('DELETE');
        expect(req.config.params).toEqual(undefined);
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

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('DELETE');
        expect(req.config.data).toEqual('{"a":"b"}');
    });

    test('DELETE function is called with params and custom headers', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'delete'
        }, {
            data: 'test'
        },true);

        xano.delete('/test', {
            'a': 'b'
        },{
            custom_header_1: 'abc',
            custom_header_2: 'def'
        });

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('DELETE');
        expect(req.config.data).toEqual('{"a":"b"}');
        expect(req.config.headers.custom_header_1).toEqual('abc');
        expect(req.config.headers.custom_header_2).toEqual('def');
    });
});
