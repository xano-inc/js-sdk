import { XanoClient } from './client';
import { XanoBaseStorage } from './models/base-storage';
import { XanoCookieStorage } from './models/cookie-storage';
import { XanoLocalStorage } from './models/local-storage';
import { XanoObjectStorage } from './models/object-storage';
import { XanoSessionStorage } from './models/session-storage';

declare global {
    var XanoBaseStorage: any;
    var XanoClient: any;
    var XanoCookieStorage: any;
    var XanoLocalStorage: any;
    var XanoObjectStorage: any;
    var XanoSessionStorage: any;
}

global.XanoBaseStorage = XanoBaseStorage;
global.XanoClient = XanoClient;
global.XanoCookieStorage = XanoCookieStorage;
global.XanoLocalStorage = XanoLocalStorage;
global.XanoObjectStorage = XanoObjectStorage;
global.XanoSessionStorage = XanoSessionStorage;
