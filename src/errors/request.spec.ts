import { XanoRequestError } from './request';
import { XanoResponse } from '../models/response';
import { describe, expect, test } from '@jest/globals';

describe('Xano Client', () => {
    beforeEach(() => {
        fetchMock.resetMocks()
    });

    test('Message should be set', () => {
        const expectedMessage = 'This is a message';

        fetchMock.mockResponseOnce('Response Body Text', {
            status: 200
        });

        fetch('test').then(
            (response: Response) => {
                const xanoResponse = new XanoResponse(response, {});

                const error = new XanoRequestError(expectedMessage, xanoResponse);

                expect(error.message).toEqual(expectedMessage);
            }
        );
    });

    test('Should have XanoResponse', () => {
        const expectedMessage = 'This is a message';
        const responseBody = 'Response Body Text';

        fetchMock.mockResponseOnce(responseBody, {
            status: 200
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

                const error = new XanoRequestError(expectedMessage, xanoResponse);

                const errorXanoResponse = error.getHttpResponse();

                expect(errorXanoResponse.getStatusCode()).toEqual(200);
                expect(errorXanoResponse.getData()).toEqual(responseBody);
            }
        );
    });
});
