declare module "netcdfjs" {
  class NetCDFReader {
    constructor(data: ArrayBuffer);

    dimensions: Array<{ name: string; size: number }>;
    getDataVariable: (name: string) => array;
  }
  export { NetCDFReader };
}
