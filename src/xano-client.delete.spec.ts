import fetchMock from 'jest-fetch-mock'
import { XanoClient } from './xano-client';
import { XanoRequestError } from './errors/request';
import { XanoResponse } from './models/response';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: Delete Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.mockResponse('');

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('Makes successful request', async () => {
        const expectedStatusCode = 200;

        fetchMock.mockResponseOnce('null', {
            status: expectedStatusCode
        });

        await xano.delete('/test').then(
            (response: XanoResponse) => {
                expect(response.getStatusCode()).toEqual(expectedStatusCode);
            },
            (response: XanoResponse) => {
                fail('Request unsuccessful when it should have succeeded');
            }
        );
    });

    test('Makes unsuccessful request', async () => {
        const expectedStatusCode = 404;

        fetchMock.mockResponseOnce('null', {
            status: expectedStatusCode
        });

        await xano.delete('/test').then(
            (response: XanoResponse) => {
                fail('Request successful when it should have failed');
            },
            (error: XanoRequestError) => {
                const response = error.getHttpResponse();

                expect(response.getStatusCode()).toEqual(expectedStatusCode);
            }
        );
    });
});
