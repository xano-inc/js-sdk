// Mock File
function FileMock(fileBits, fileName) {
}

global.File = FileMock;

// Mock LocalStorage
class LocalStorageMock {
    store = {}

    clear() {
        this.store = {}
    }

    getAll() {
        return this.store;
    }

    getItem(key) {
        return this.store[key] || null
    }

    setItem(key, value) {
        this.store[key] = value
    }

    removeItem(key) {
        delete this.store[key]
    }
}

global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();

// Mock document
global.document = {
    cookie_: '',

    get cookie() {
        return this.cookie_;
    },

    set cookie(value) {
        this.cookie_ += value + '; ';
    }
};
