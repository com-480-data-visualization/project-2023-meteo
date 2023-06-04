import { CloudIcon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import formatcoords from "formatcoords";
import { LngLat } from "mapbox-gl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DataContext,
  DataProvider,
  dataBounds,
  dataHeight,
  dataWidth,
  intTimeToStrTime,
} from "./DataContext";
import { useContext, useEffect, useState } from "react";
import { DateTime } from "luxon";

const HOURS_IN_DAY = 24;

async function getAllData(dataProvider: DataProvider, x: number, y: number) {
  const metadata = await dataProvider.getMetadata();
  const { hour_min, hour_max } = metadata;
  const timeCount = DateTime.fromISO(hour_max)
    .diff(DateTime.fromISO(hour_min))
    .as("hours");
  const data = await Promise.all(
    Array.from(Array(timeCount).keys()).map(async (t) => {
      const timeStr = intTimeToStrTime(t, metadata);
      const reals = await dataProvider.getAllRealizations(timeStr);
      const idx = (dataHeight - y - 1) * dataWidth + x;
      const forPoint = reals.map((r) => r.precipitations[idx]);
      const min = Math.min(...forPoint);
      const max = Math.max(...forPoint);
      const mean = forPoint.reduce((a, b) => a + b) / forPoint.length;
      return { time: t, min: min, max: max, mean: mean, ...forPoint };
    })
  );
  return { data, metadata };
}
const SidePanel = ({ loc, onClose }: { loc: LngLat; onClose?: () => void }) => {
  const dataProvider = useContext(DataContext);
  const [formattedLat, formattedLng] = formatcoords(loc.lng, loc.lat, true)
    .format("DD MM ss X", { latLonSeparator: ";", decimalPlaces: 4 })
    .split(";");
  const [data, setData] = useState<any>(undefined);

  /* We need the closest point, then all realizations over time */
  // 0..200[
  const x = Math.round(
    dataWidth *
      ((loc.lng - dataBounds[0][0]) / (dataBounds[1][0] - dataBounds[0][0]))
  );
  // 0..135[
  const y = Math.round(
    dataHeight *
      ((loc.lat - dataBounds[3][1]) / (dataBounds[1][1] - dataBounds[3][1]))
  );

  useEffect(() => {
    getAllData(dataProvider, x, y).then((d) => setData(d));
  }, [loc]);
  console.log(data);
  return (
    <div className="relative">
      <button onClick={onClose} className="absolute right-0 top-0 ">
        <XMarkIcon className="w-7" />
      </button>
      {/*<h3 className="text-center text-2xl">Lausanne</h3>*/}
      <h4 className="text-md text-center">{formattedLat}</h4>
      <h4 className="text-md text-center">{formattedLng}</h4>
      {data ? (
        <>
          <div className="mx-14 mb-8">
            {Array.from(new Array(5).keys())
              .map((i) => data.data[i * HOURS_IN_DAY])
              .map((d, i) => (
                <div
                  key={i}
                  className="flex flex-row flex-nowrap justify-between"
                >
                  <span>
                    {DateTime.fromISO(data.metadata.hour_min)
                      .plus({ day: i })
                      .toFormat("cccc")}
                  </span>
                  <span className="w-5">
                    {d.mean < 1 ? (
                      <SunIcon className="w-5" />
                    ) : (
                      <CloudIcon className="w-5" />
                    )}
                  </span>
                </div>
              ))}
          </div>
          <div>
            <ResponsiveContainer width="95%" height={300}>
              <LineChart data={data.data}>
                <Line
                  type="monotone"
                  dot={false}
                  dataKey={"min"}
                  stroke="#8884d8"
                />
                <Line
                  type="monotone"
                  dot={false}
                  dataKey={"max"}
                  stroke="#82ca9d"
                />
                <Line
                  type="monotone"
                  dot={false}
                  dataKey={"mean"}
                  stroke="#ffc658"
                />
                <YAxis />
                <XAxis
                  dataKey="time"
                  tickFormatter={(i) => intTimeToStrTime(i, data.metadata)}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        "Loading"
      )}
    </div>
  );
};

export default SidePanel;
