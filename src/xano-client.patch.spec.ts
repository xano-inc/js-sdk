import fetchMock from 'jest-fetch-mock'
import { XanoClient } from './xano-client';
import { XanoRequestError } from './errors/request';
import { XanoResponse } from './models/response';
import { XanoResponseType } from './enums/response-type';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client: PATCH Requests', () => {
    const apiGroupBaseUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw';

    let xano: XanoClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.mockResponse('');

        xano = new XanoClient({
            'apiGroupBaseUrl': apiGroupBaseUrl
        });
    });

    test('Returns successful JSON', async () => {
        const expectedStatusCode = 200;
        const expectedResponse = {
            'message': 'This is a response'
        };

        fetchMock.mockResponseOnce(JSON.stringify(expectedResponse), {
            status: expectedStatusCode
        });

        await xano.patch('/test').then(
            (response: XanoResponse) => {
                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getBody()).toEqual(expectedResponse);
            }
        );
    });

    test('Returns error JSON', async () => {
        const expectedStatusCode = 404;
        const expectedResponse = {
            'message': 'This is a response'
        };

        fetchMock.mockResponseOnce(JSON.stringify(expectedResponse), {
            status: expectedStatusCode
        });

        await xano.patch('/test').then(
            (response: XanoResponse) => {
                fail('Responded with success even though it should be error');
            },
            (error: XanoRequestError) => {
                const response = error.getHttpResponse();

                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getBody()).toEqual(expectedResponse);
            }
        );
    });
});
