import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { DataContext, globalDataProvider } from "./DataContext";
import { RenderProvider } from "./RenderContext";
import AppWrapper from "./AppWrapper";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DataContext.Provider value={globalDataProvider}>
      <RenderProvider>
        <AppWrapper></AppWrapper>
      </RenderProvider>
    </DataContext.Provider>
  </React.StrictMode>
);
