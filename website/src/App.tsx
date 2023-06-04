import Map, { Layer, NavigationControl, Source } from "react-map-gl";
import { LngLat } from "mapbox-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "./App.css";
import { useRender } from "./dataManager";
import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import SidePanel from "./SidePanel";
import { Metadata, dataBounds, intTimeToStrTime } from "./DataContext";
import { VisualizationType } from "./RenderContext";
import { DateTime } from "luxon";

const { VITE_MAPTILER_API_KEY } = import.meta.env;

function App({ hour_min, hour_max }: Metadata) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sidePanel, setSidePanel] = useState<LngLat | undefined>(undefined);
  const [vis, setViz] = useState<VisualizationType>(VisualizationType.MAX);
  const timer = useRef<number | undefined>(undefined);
  const timeCount = DateTime.fromISO(hour_max)
    .diff(DateTime.fromISO(hour_min))
    .as("hours");

  useEffect(() => {
    if (playing && time != undefined) {
      timer.current = setInterval(
        () => setTime((time) => (time + 1) % timeCount),
        1000
      );
      if (timer.current !== undefined) {
        return () => clearInterval(timer.current);
      } else if (timer.current) {
        clearInterval(timer.current);
      }
    }
  }, [timer, playing]);

  const frame = useRender(intTimeToStrTime(time, { hour_min, hour_max }), vis);

  return (
    <>
      <div></div>
      <Map
        mapLib={maplibregl}
        mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${VITE_MAPTILER_API_KEY}`}
        maxBounds={[5.5, 45, 11, 48.5]}
        customAttribution={`<a href="https://www.meteosuisse.admin.ch/">© MeteoSuisse</a>`}
        onClick={(props) => setSidePanel(props.lngLat)}
      >
        <NavigationControl />
        {
          <Source
            id="weather"
            coordinates={dataBounds}
            animate={true}
            type="canvas"
            canvas={frame}
          >
            <Layer type="raster" />
          </Source>
        }
        <div className="pointer-events-none relative h-full w-full p-10">
          <div
            className={
              "relative inline-block h-full pr-10 " +
              (sidePanel ? "w-7/12" : "w-full")
            }
          >
            <div className="relative h-full w-full ">
              <div className="pointer-events-auto absolute bottom-0 left-0 right-0 mx-auto flex w-full max-w-4xl flex-row flex-nowrap justify-between rounded-md bg-white p-7">
                <select
                  className="w-2/12 p-3"
                  value={vis}
                  onChange={(ev) => setViz(parseInt(ev.target.value))}
                >
                  <option value={VisualizationType.REAL1}>Realization 1</option>
                  <option value={VisualizationType.MIN}>Minimum</option>
                  <option value={VisualizationType.MAX}>Maximum</option>
                  <option value={VisualizationType.MEAN}>Mean</option>
                  <option value={VisualizationType.NONE}>None</option>
                </select>
                <button
                  onClick={() => setPlaying(!playing)}
                  className="mx-8 inline-block align-text-bottom"
                >
                  {playing ? (
                    <PauseIcon className="w-7"></PauseIcon>
                  ) : (
                    <PlayIcon className="w-7"></PlayIcon>
                  )}
                </button>
                <div className="inline-block h-full w-8/12 accent-red-50">
                  <input
                    className="mb-2 block w-full"
                    type="range"
                    min={0}
                    max={timeCount}
                    value={time}
                    onChange={(ev) =>
                      setTime(parseInt(ev.currentTarget.value, 10))
                    }
                  />
                  <span className="block w-full text-center">
                    {intTimeToStrTime(time, { hour_min, hour_max })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {sidePanel != undefined && (
            <div className="relative right-0 inline-block w-5/12">
              <div className="pointer-events-auto absolute bottom-0 right-0 mx-auto w-full rounded-md bg-white p-7">
                <SidePanel
                  loc={sidePanel}
                  onClose={() => setSidePanel(undefined)}
                />
              </div>
            </div>
          )}
        </div>
      </Map>
    </>
  );
}

export default App;
