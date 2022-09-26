import { XanoBaseStorage } from '../../src/models/base-storage';
import { XanoCookieStorage } from '../../src/models/cookie-storage';
import { beforeEach, describe, expect, test } from '@jest/globals';

describe('XanoCookieStorage', () => {
    let storage: XanoBaseStorage;

    function removeBadTestKeys(resp: Record<string, string>): Record<string, string> {
        delete resp['expires'];
        delete resp['path'];

        return resp;
    }

    beforeEach(() => {
        storage = new XanoCookieStorage();
    });

    test('Should default to empty', () => {
        expect(storage.getAll()).toEqual({});
    });

    test('Should set and get item', () => {
        storage.setItem('a', '1');
        expect(storage.getItem('a')).toEqual('1');
    });

    test('Should remove item', () => {
        let resp: Record<string, string> = {};

        storage.setItem('a', '1');
        storage.setItem('b', '2');

        resp = removeBadTestKeys(storage.getAll());
        expect(resp).toEqual({
            'a': '1',
            'b': '2'
        });

        storage.removeItem('b');

        resp = removeBadTestKeys(storage.getAll());
        expect(resp['a']).toEqual('1');
        expect(resp['b']).toEqual('');

        storage.clear();

        resp = removeBadTestKeys(storage.getAll());
        expect(resp['a']).toEqual('');
        expect(resp['b']).toEqual('');
    });
});
