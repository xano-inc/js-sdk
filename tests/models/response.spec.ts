import fetchMock from 'jest-fetch-mock'
import { XanoResponse } from '../../src/models/response';
import { describe, expect, test } from '@jest/globals';

describe('XanoResponse', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    test('Status code is 200', () => {
        fetchMock.mockResponseOnce('Response Body Text', {
            status: 200
        });

        fetch('test').then(
            (response: Response) => {
                const xanoResponse = new XanoResponse(response, {});

                expect(xanoResponse.getStatusCode()).toEqual(200);
            }
        );
    });

    test('Status code is 404', () => {
        fetchMock.mockResponseOnce('Response Body Text', {
            status: 404
        });

        fetch('test').then(
            (response: Response) => {
                const xanoResponse = new XanoResponse(response, {});

                expect(xanoResponse.getStatusCode()).toEqual(404);
            }
        );
    });

    test('Should have string data', () => {
        const responseString = 'Response Body Text';

        fetchMock.mockResponseOnce(responseString);

        let rawResponse: Response;

        fetch('test').then(
            (response: Response) => {
                rawResponse = response;

                return response.text();
            }
        ).then(
            (data: any) => {
                const xanoResponse = new XanoResponse(rawResponse, data);

                expect(xanoResponse.getBody()).toEqual(responseString);
            }
        );
    });

    test('Should have JSON data', () => {
        const responseJson = {
            'a': 'b',
            'c': 'd'
        };

        fetchMock.mockResponseOnce(JSON.stringify(responseJson));

        let rawResponse: Response;

        fetch('test').then(
            (response: Response) => {
                rawResponse = response;

                return response.json();
            }
        ).then(
            (data: any) => {
                const xanoResponse = new XanoResponse(rawResponse, data);

                expect(xanoResponse.getBody()).toEqual(responseJson);
            }
        );
    });

    test('Should have headers', () => {
        const requestHeaders = {
            'content-type': 'application/json'
        };

        fetchMock.mockResponseOnce('', {
            headers: requestHeaders
        });

        let rawResponse: Response;

        fetch('test').then(
            (response: Response) => {
                rawResponse = response;

                return response.text();
            }
        ).then(
            (data: any) => {
                const xanoResponse = new XanoResponse(rawResponse, data);

                expect(xanoResponse.getHeaders()).toEqual(requestHeaders);
            }
        );
    });
});
