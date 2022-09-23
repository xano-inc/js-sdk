import { XanoClient } from './client';

declare global {
    var XanoClient: any;
}

global.XanoClient = XanoClient;
