declare module "screenshot-desktop" {
  interface Display {
    id: string;
    name: string;
    primary?: boolean;
    width?: number;
    height?: number;
  }

  interface ScreenshotOptions {
    screen?: string;
    format?: "png" | "jpg";
  }

  function screenshot(opts?: ScreenshotOptions): Promise<Buffer>;
  namespace screenshot {
    function listDisplays(): Promise<Display[]>;
  }

  export = screenshot;
}
