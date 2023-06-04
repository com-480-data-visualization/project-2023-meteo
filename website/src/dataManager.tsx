import { useRef, useContext } from "react";
import { RenderContext, VisualizationType } from "./RenderContext";
import { dataHeight, dataWidth } from "./DataContext";

function useRender(time: string | undefined, visualization: VisualizationType) {
  const { render } = useContext(RenderContext);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const canvas = canvasRef.current;
  if (canvas && time) {
    render(canvas, { visualization, time });
  }
  canvasRef.current.width = dataWidth;
  canvasRef.current.height = dataHeight;

  return canvasRef.current;
}

/*
function Data() {
  const { render } = useContext(RenderContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (canvas) {
      render(canvas, { realization: 1, lead: 23 });
    }
  }, [canvasRef]);

  return <canvas width={200} height={135} ref={canvasRef} />;
}
 */

export { useRender };
