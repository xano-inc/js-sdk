// Mock Fetch
global.fetch = require('jest-fetch-mock');
global.fetch.enableMocks();

// Mock FormData
function FormDataMock() {
    this.append = jest.fn();
}

global.FormData = FormDataMock;

// Mock File
function FileMock() {
    // Just need the class to exist
}

global.File = FileMock;
