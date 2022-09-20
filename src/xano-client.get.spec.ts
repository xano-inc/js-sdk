import fetchMock from 'jest-fetch-mock'
import { XanoClient } from './xano-client';
import { XanoResponse } from './models/response';
import { XanoResponseType } from './enums/response-type';
import { describe, expect, test } from '@jest/globals';
import { XanoRequestError } from './errors/request';

describe('Xano Client: GET Requests', () => {
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

        await xano.get('/test').then(
            (response: XanoResponse) => {
                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getData()).toEqual(expectedResponse);
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

        await xano.get('/test').then(
            (response: XanoResponse) => {
                fail('Responded with success even though it should be error');
            },
            (error: XanoRequestError) => {
                const response = error.getHttpResponse();

                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getData()).toEqual(expectedResponse);
            }
        );
    });

    test('Returns successful text', async () => {
        const expectedStatusCode = 200;
        const expectedResponse = 'This is a response';

        fetchMock.mockResponseOnce(expectedResponse, {
            status: expectedStatusCode
        });

        xano.setResponseType(XanoResponseType.Text);

        await xano.get('/test').then(
            (response: XanoResponse) => {
                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getData()).toEqual(expectedResponse);
            }
        );
    });

    test('Returns error string', async () => {
        const expectedStatusCode = 404;
        const expectedResponse = 'This is a response';

        fetchMock.mockResponseOnce(expectedResponse, {
            status: expectedStatusCode
        });

        xano.setResponseType(XanoResponseType.Text);

        await xano.get('/test').then(
            (response: XanoResponse) => {
                fail('Responded with success even though it should be error');
            },
            (error: XanoRequestError) => {
                const response = error.getHttpResponse();

                expect(response.getStatusCode()).toEqual(expectedStatusCode);
                expect(response.getData()).toEqual(expectedResponse);
            }
        );
    });
});
