import { XanoRequestError } from '../../src/errors/request';
import { XanoResponse } from '../../src/models/response';
import { describe, expect, test } from '@jest/globals';
import { AxiosResponse } from 'axios';

describe('XanoResponse', () => {
    const expectedErrorMessage = 'Test message';
    const expectedErrorHttpStatus = 404;

    const xanoResponse = new XanoResponse(<AxiosResponse>{
        data: '',
        headers: {},
        status: expectedErrorHttpStatus
    });

    const err: XanoRequestError = new XanoRequestError(expectedErrorMessage, xanoResponse);

    test('Should have a message', () => {
        expect(err.message).toEqual(expectedErrorMessage);
    });

    test('Should return XanoResponse', () => {
        expect((err.getResponse() instanceof XanoResponse)).toBeTruthy();
    });

    test('Should return XanoResponse with correct status', () => {
        expect(err.getResponse().getStatusCode()).toEqual(expectedErrorHttpStatus);
    })
});
