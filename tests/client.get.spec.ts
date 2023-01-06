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

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('GET');
        expect(req.config.params).toEqual(undefined);
    });

    test('GET function is called with params', () => {
        const expectedParams = {
            'a': 'b'
        };

        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test'
        }, true);

        xano.get('/test', expectedParams);

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('GET');
        expect(req.config.params).toEqual(expectedParams);
    });

    test('GET function is called with params and custom headers', () => {
        const expectedParams = {
            'a': 'b'
        };

        const expectedHeaders = {
            'header_1': 'abc',
            'header_2': 'def'
        };

        mockAxios.mockResponseFor({
            url: '/test',
            method: 'get'
        }, {
            data: 'test'
        }, true);

        xano.get('/test', expectedParams, expectedHeaders);

        const req = mockAxios.lastReqGet();

        expect(req.method).toEqual('GET');
        expect(req.config.params).toEqual(expectedParams);
        expect(req.config.headers).toEqual(expectedHeaders);
    });
});
