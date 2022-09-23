import mockAxios from 'jest-mock-axios';
import { AxiosResponse, AxiosResponseHeaders } from 'axios';
import { XanoResponse } from '../../src/models/response';
import { describe, expect, test } from '@jest/globals';

describe('XanoResponse', () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    test('Status should return', () => {
        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: '',
            headers: {},
            status: 200
        });

        expect(xanoResponse.getStatusCode()).toEqual(200);
    });

    test('Headers should return', () => {
        const expectedHeaders = {
            'content-type': 'application/json'
        };

        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: '',
            headers: <AxiosResponseHeaders>expectedHeaders,
            status: 200
        });

        expect(xanoResponse.getHeaders()).toEqual(expectedHeaders);
    });

    test('Body should return a string', () => {
        const expectedResult: string = 'abcdef';

        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: expectedResult,
            status: 200
        });

        expect(xanoResponse.getBody()).toEqual(expectedResult);
    });

    test('Body should return a JSON string', () => {
        const expectedResult: string = '{"a":"b"}';

        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: expectedResult,
            status: 200
        });

        expect(xanoResponse.getBody()).toEqual(expectedResult);
    });

    test('Body should JSON based on response header', () => {
        const expectedResult = {
            'a': 'b'
        };

        const headers = {
            'content-type': 'application/json'
        };

        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: JSON.stringify(expectedResult),
            headers: <AxiosResponseHeaders>headers,
            status: 200
        });

        expect(xanoResponse.getBody()).toEqual(expectedResult);
    });
});
