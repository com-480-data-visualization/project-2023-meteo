import chroma from "chroma-js";
import React, { createContext, useContext } from "react";
import sleep from "sleep-promise";
import { DataContext, DataProvider, globalDataProvider } from "./DataContext";

enum VisualizationType {
  MEAN,
  MAX,
  MIN,
  REAL1,
  NONE,
}

interface RenderingArgs {
  visualization: VisualizationType;
  time: string;
}
interface RenderCacheEntry {
  width: number;
  height: number;
  data: Blob;
}
const Renderer = (dataContext: DataProvider) => {
  const renderCache = new Map<string, RenderCacheEntry>();
  const renderQueue = new Set<string>();

  const renderMean = async (time: string) => {
    const data = await dataContext.getAllRealizations(time);
    const { width, height } = data[0];
    const precipitations = new Array(width * height).fill(0);
    for (let k = 0; k < data.length; k++) {
      for (let j = 0; j < width * height; j++) {
        if (!isNaN(data[k].precipitations[j]))
          precipitations[j] += data[k].precipitations[j];
      }
    }
    for (let j = 0; j < width * height; j++) {
      precipitations[j] = precipitations[j] / data.length;
    }
    return { width, height, precipitations };
  };
  const renderMax = async (time: string) => {
    const data = await dataContext.getAllRealizations(time);
    const { width, height } = data[0];
    const precipitations = Array(width * height);
    for (let j = 0; j < width * height; j++) {
      const max = Number.MIN_VALUE;
      for (let k = 0; k < data.length; k++) {
        if (data[k].precipitations[j] > max) {
          precipitations[j] = data[k].precipitations[j];
        }
      }
    }
    return { width, height, precipitations };
  };
  const renderMin = async (time: string) => {
    const data = await dataContext.getAllRealizations(time);
    const { width, height } = data[0];
    const precipitations = Array(width * height);
    for (let j = 0; j < width * height; j++) {
      const min = Number.MAX_VALUE;
      for (let k = 0; k < data.length; k++) {
        if (data[k].precipitations[j] < min) {
          precipitations[j] = data[k].precipitations[j];
        }
      }
    }
    return { width, height, precipitations };
  };
  const renderReal1 = async (time: string) => {
    const data = dataContext.render({ realization: 1, time: time });
    return await data;
  };
  const render = async (canvas: HTMLCanvasElement, args: RenderingArgs) => {
    const seralizedArgs = JSON.stringify(args);
    while (renderQueue.has(seralizedArgs)) {
      await sleep(100);
    }
    const ctx = canvas.getContext("2d")!;
    if (renderCache.has(seralizedArgs)) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0);
      };
      const { width, height, data } = renderCache.get(seralizedArgs)!;
      img.src = URL.createObjectURL(data);
      img.width = width;
      img.height = height;
      return [width, height];
    }
    renderQueue.add(seralizedArgs);

    let { precipitations, width, height } = await (async () => {
      switch (args.visualization) {
        case VisualizationType.MEAN:
          return await renderMean(args.time);
        case VisualizationType.MAX:
          return await renderMax(args.time);
        case VisualizationType.MIN:
          return await renderMin(args.time);
        case VisualizationType.REAL1:
          return await renderReal1(args.time);
        case VisualizationType.NONE:
          return { precipitations: Array(), width: 0, height: 0 };
        default:
          throw new Error(`Unknown visualization ${args.visualization}`);
      }
    })();
    const imageData = new ImageData(width, height);

    const min = 0;
    const max = 132;
    const gradient = chroma.scale([
      chroma("#00000000"),
      "yellow",
      "red",
      "black",
    ]);
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const pixel = j * width + i;
        const data = (height - j - 1) * width + i;
        // TODO write a nice coloring function from double -> uint8
        const value = precipitations[data];
        const relative = (value - min) / (max - min);
        const color = gradient(relative);
        imageData.data[4 * pixel] = color.rgb()[0];
        imageData.data[4 * pixel + 1] = color.rgb()[1];
        imageData.data[4 * pixel + 2] = color.rgb()[2]; // Blue
        imageData.data[4 * pixel + 3] = Math.round(color.alpha() * 255);
      }
    }

    ctx?.putImageData(imageData, 0, 0);

    canvas.toBlob((blob) => {
      if (blob != null)
        renderCache.set(seralizedArgs, {
          width: width,
          height: height,
          data: blob,
        });
      renderQueue.delete(seralizedArgs);
    });
    return [width, height];
  };
  return { render };
};
/* tsserver: ignore. */
const RenderContext = createContext(Renderer(globalDataProvider));

const RenderProvider = (props: React.PropsWithChildren) => {
  const dataContext = useContext(DataContext);
  return (
    <RenderContext.Provider value={Renderer(dataContext)}>
      {props.children}
    </RenderContext.Provider>
  );
};

export { RenderContext, RenderProvider, VisualizationType };
