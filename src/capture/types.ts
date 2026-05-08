export interface Monitor {
  index: number;
  width: number;
  height: number;
  primary: boolean;
  name?: string;
}

export interface Backend {
  listMonitors(): Promise<Monitor[]>;
  capture(monitorIndex: number): Promise<Buffer>;
}
