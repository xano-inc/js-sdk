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

    test('isAuthenticated to be false', () => {
        expect((<any>xano).isAuthenticated()).toBeFalsy();
    });

    test('isAuthenticated to be true', () => {
        xano.setAuthBearerToken('abc');

        expect((<any>xano).isAuthenticated()).toBeTruthy();
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

    test('setAuthBearerToken updates config', () => {
        expect((<any>xano).config.authBearerToken).toEqual(undefined);
        const resp = xano.setAuthBearerToken('abc');
        expect(resp instanceof XanoClient).toBeTruthy();
        expect((<any>xano).config.authBearerToken).toEqual('abc');
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
        const isAuthenticatedSpy = jest.spyOn(XanoClient.prototype as any, 'isAuthenticated');

        fetchMock.mockResponseOnce(JSON.stringify({'a': 'b'}));

        await xano.get('/test');

        expect(isAuthenticatedSpy).toBeCalledTimes(1);
    });
});
