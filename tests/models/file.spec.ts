import { XanoFile } from '../../src/models/file';
import { describe, expect, test } from '@jest/globals';

describe('XanoResponse', () => {
    const expectedName = 'test.csv';
    const expectedBuffer = Buffer.from('Welcome');

    const file = new XanoFile(expectedName, expectedBuffer);

    test('Should return file name', () => {
        expect(file.getName()).toEqual(expectedName);
    });

    test('Should return buffer', () => {
        expect(file.getBuffer()).toEqual(expectedBuffer);
    });
});
