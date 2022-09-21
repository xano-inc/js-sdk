import fetchMock from 'jest-fetch-mock'
import { XanoClient } from './xano-client';
import { XanoResponseType } from './enums/response-type';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.mockResponse('');

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

    test('updateUrlWithParams with object', () => {
        const params = {
            'a': 'b',
            'c': 'd',
            1: 2,
            3: false
        };

        const finalUrl = apiGroupBaseUrl + '?1=2&3=false&a=b&c=d';

        const url = new URL(apiGroupBaseUrl);

        expect(url.toString()).toEqual(apiGroupBaseUrl);

        (<any>xano).updateUrlWithParams(url, params);

        expect(url.toString()).toEqual(finalUrl);
    });

    test('setAuthToken updates config', () => {
        expect((<any>xano).config.authToken).toEqual(null);
        const resp = xano.setAuthToken('abc');
        expect(resp instanceof XanoClient).toBeTruthy();
        expect((<any>xano).config.authToken).toEqual('abc');
    });

    test('setResponseType updates config', () => {
        expect((<any>xano).config.responseType).toEqual(XanoResponseType.Default);
        const resp = xano.setResponseType(XanoResponseType.Text);
        expect(resp instanceof XanoClient).toBeTruthy();
        expect((<any>xano).config.responseType).toEqual(XanoResponseType.Text);
    });

    test('Test request with URL params', async () => {
        const updateUrlWithParamsSpy = jest.spyOn(XanoClient.prototype as any, 'updateUrlWithParams');

        fetchMock.mockResponseOnce(JSON.stringify({'a': 'b'}));

        await xano.get('/test', {
            'a': 'b'
        });

        expect(updateUrlWithParamsSpy).toBeCalled();
    });

    test('Test request with authentication', async () => {
        const hasAuthTokenSpy = jest.spyOn(XanoClient.prototype as any, 'hasAuthToken');

        fetchMock.mockResponseOnce(JSON.stringify({'a': 'b'}));

        await xano.get('/test');

        expect(hasAuthTokenSpy).toBeCalledTimes(1);
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
            'c': new File(null, null)
        };

        const ret = (<any>xano).buildFormData(simpleObject);

        expect(ret.hasFile).toBeTruthy();
    });
});
