import { AxiosProgressEvent } from "axios";

export type XanoStreamingCallback = (progressEvent: AxiosProgressEvent) => void;
