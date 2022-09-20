import { XanoClient } from './xano-client';

declare global {
    var XanoClient: any;
}

global.XanoClient = XanoClient;