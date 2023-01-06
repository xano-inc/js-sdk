import mockAxios from 'jest-mock-axios';
import { XanoNodeClient as XanoClient } from '../src/node-client';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: PATCH Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        mockAxios.reset();

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('PATCH function is called', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'patch'
        }, {
            data: 'test'
        }, true);

        xano.patch('/test');

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('PATCH');
        expect(req.config.data).toEqual(undefined);
    });

    test('PATCH function is called with params', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'patch'
        }, {
            data: 'test'
        }, true);

        xano.patch('/test', {
            'a': 'b'
        });

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('PATCH');
        expect(req.config.data).toEqual('{"a":"b"}');
    });

    test('PATCH function is called with params and custom header', () => {
        mockAxios.mockResponseFor({
            url: '/test',
            method: 'patch'
        }, {
            data: 'test'
        },true);

        xano.patch('/test', {
            'a': 'b'
        },{
            custom_header_1: 'abc',
            custom_header_2: 'def'
        });

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('PATCH');
        expect(req.config.data).toEqual('{"a":"b"}');
        expect(req.config.headers.custom_header_1).toEqual('abc');
        expect(req.config.headers.custom_header_2).toEqual('def');
    });
});
