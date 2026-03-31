declare module "@imgly/background-removal" {
  export interface Config {
    publicPath?: string;
    debug?: boolean;
    proxyToWorker?: boolean;
    model?: "small" | "medium" | "large";
    output?: {
      format?: "image/png" | "image/jpeg" | "image/webp";
      quality?: number;
      type?: "foreground" | "background" | "mask";
    };
    progress?: (key: string, current: number, total: number) => void;
  }

  export function removeBackground(
    image: ImageData | ArrayBuffer | Uint8Array | Blob | URL | string,
    config?: Config
  ): Promise<Blob>;
}
