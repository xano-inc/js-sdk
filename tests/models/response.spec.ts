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

    test('Body should have JSON prefixed', () => {
        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: JSON.stringify({
                'a': 'b'
            }),
            headers: <AxiosResponseHeaders>{
                'content-type': 'application/json'
            },
            status: 200
        }, 'xano_');

        expect(xanoResponse.getBody()).toEqual({
            'xano_a': 'b'
        });
    });

    test('Body should have Array prefixed', () => {
        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: JSON.stringify([
                {
                    name: 'Justin Albrecht'
                },
                {
                    name: 'Eli Beachy'
                }
            ]),
            headers: <AxiosResponseHeaders>{
                'content-type': 'application/json'
            },
            status: 200
        }, 'xano_');

        expect(xanoResponse.getBody()).toEqual([
            {
                xano_name: 'Justin Albrecht'
            },
            {
                xano_name: 'Eli Beachy'
            }
        ]);
    });

    test('Body should have recursive Array and Objects prefixed', () => {
        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: JSON.stringify({
                itemsReceived: 2,
                curPage: 1,
                nextPage: null,
                prevPage: null,
                itemsTotal: 2,
                pageTotal: 1,
                items: [
                    {
                        name: 'Justin Albrecht',
                        roles: [
                            {
                                name: 'Developer'
                            }
                        ]
                    },
                    {
                        name: 'Eli Beachy',
                        roles: [
                            {
                                name: 'Bubble Expert'
                            },
                            {
                                name: 'Beta Tester'
                            }
                        ]
                    }
                ]
            }),
            headers: <AxiosResponseHeaders>{
                'content-type': 'application/json'
            },
            status: 200
        }, 'xano_');

        expect(xanoResponse.getBody()).toEqual({
            xano_itemsReceived: 2,
            xano_curPage: 1,
            xano_nextPage: null,
            xano_prevPage: null,
            xano_itemsTotal: 2,
            xano_pageTotal: 1,
            xano_items: [
                {
                    xano_name: 'Justin Albrecht',
                    xano_roles: [
                        {
                            xano_name: 'Developer'
                        }
                    ]
                },
                {
                    xano_name: 'Eli Beachy',
                    xano_roles: [
                        {
                            xano_name: 'Bubble Expert'
                        },
                        {
                            xano_name: 'Beta Tester'
                        }
                    ]
                }
            ]
        });
    });

    test('Body should not have String prefixed', () => {
        const expectedResult = 'This response is just a string';

        const xanoResponse = new XanoResponse(<AxiosResponse>{
            data: expectedResult,
            status: 200
        }, 'xano_');

        expect(xanoResponse.getBody()).toEqual(expectedResult);
    });
});
