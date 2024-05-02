export interface IRealtimeClient {
  extras: Record<string, any>;
  permissions: {
    dbo_id: number;
    row_id: number;
  };
  socketId: string;
}
