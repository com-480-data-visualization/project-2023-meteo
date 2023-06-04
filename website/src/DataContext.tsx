import { DateTime } from "luxon";
import { NetCDFReader } from "netcdfjs";
import { createContext } from "react";
import sleep from "sleep-promise";

/* Computed from min/max points of the dataset
coordinates={[
  [5.6575, 47.9698],
  [10.9078, 47.9698],
  [10.9078, 45.5965],
  [5.6575, 45.5965],
]}
                 */
// https://epsg.io/2056
const dataBounds = [
  [5.96, 47.81],
  [10.49, 47.81],
  [10.49, 45.82],
  [5.96, 45.82],
];
const dataWidth = 200;
const dataHeight = 135;

interface DataQueryArgs {
  realization: number;
  time: string;
}
interface DataCacheEntry {
  width: number;
  height: number;
  precipitations: Array<number>;
}
interface Metadata {
  real_min: number;
  real_max: number;
  hour_min: string;
  hour_max: string;
}
interface DataProvider {
  render: (args: DataQueryArgs) => Promise<DataCacheEntry>;
  getMetadata: () => Promise<Metadata>;
  getAllRealizations: (time: string) => Promise<Array<DataCacheEntry>>;
}
function intTimeToStrTime(
  time: number,
  { hour_min }: { hour_min: string; hour_max: string }
) {
  return DateTime.fromISO(hour_min).plus({ hours: time }).toISO()!.slice(0, 13);
}
const DataProvider: () => DataProvider = () => {
  let metadata: Metadata | undefined = undefined;
  const dataCache = new Map<string, DataCacheEntry>();
  const dataQueue = new Set<string>();

  const getAllRealizations = async (time: string) => {
    const { real_min, real_max } = await getMetadata();
    const data = Promise.all(
      Array.from(Array(real_max - real_min).keys())
        .map((i) => i + real_min)
        .map((i) => render({ realization: i, time: time }))
    );
    return await data;
  };
  const getMetadata = async () => {
    if (metadata != undefined) {
      return metadata;
    }
    const res = await fetch(
      `${import.meta.env.BASE_URL}precipitations/metadata.json`
    );
    const meta = await res.json();
    metadata = meta;
    return meta;
  };
  const render = async (args: DataQueryArgs) => {
    const seralizedArgs = JSON.stringify(args);
    while (dataQueue.has(seralizedArgs)) {
      await sleep(100);
    }
    if (dataCache.has(seralizedArgs)) {
      return dataCache.get(seralizedArgs)!;
    }
    dataQueue.add(seralizedArgs);
    const res = await fetch(
      `${import.meta.env.BASE_URL}precipitations/real-${args.realization}-t-${
        args.time
      }.nc`
    );
    const array = await res.arrayBuffer();
    const CDFdata = new NetCDFReader(array);
    const height = CDFdata.dimensions.find(({ name }) => name === "y")?.size;
    const width = CDFdata.dimensions.find(({ name }) => name === "x")?.size;
    if (width === undefined || height === undefined) {
      throw new Error("Incomplete dataset");
    }

    const precipitations = CDFdata.getDataVariable(
      "precipitation_amount_1hsum"
    );

    const data = { width, height, precipitations };
    dataCache.set(seralizedArgs, data);
    dataQueue.delete(seralizedArgs);
    return data;
  };
  return { render, getMetadata, getAllRealizations };
};
const globalDataProvider = DataProvider();
const DataContext = createContext(globalDataProvider);
export {
  DataContext,
  DataProvider,
  globalDataProvider,
  dataBounds,
  dataWidth,
  dataHeight,
  intTimeToStrTime,
};
export type { Metadata };
