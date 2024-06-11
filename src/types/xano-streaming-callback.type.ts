import { XanoEventStream } from "../models/event-stream";

export type XanoStreamingCallback = (eventStream: XanoEventStream) => void;
