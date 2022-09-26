import { XanoStorage } from '../../src/models/storage';
import { describe, expect, test } from '@jest/globals';

describe('XanoStorage', () => {
    const storage = new XanoStorage();

    beforeEach(() => {
        storage.clear();
    });

    test('Should default to empty', () => {
        expect(storage.getAll()).toEqual({});
    });

    test('Should set and get item', () => {
        storage.setItem('a', '1');
        expect(storage.getItem('a')).toEqual('1');
    });

    test('Should remove item', () => {
        storage.setItem('a', '1');
        storage.setItem('b', '2');

        expect(storage.getAll()).toEqual({
            'a': '1',
            'b': '2'
        });

        storage.removeItem('a');

        expect(storage.getAll()).toEqual({
            'b': '2'
        });

        storage.clear();

        expect(storage.getAll()).toEqual({});
    });
});
