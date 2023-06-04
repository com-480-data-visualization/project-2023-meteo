import { useContext, useEffect, useState } from "react";
import { DataContext, Metadata } from "./DataContext";
import App from "./App";

const AppWrapper = () => {
  const dataProvider = useContext(DataContext);
  const [timeBounds, setTimeBounds] = useState<undefined | Metadata>(undefined);
  useEffect(() => {
    (async () => {
      const metadata = await dataProvider.getMetadata();
      setTimeBounds(metadata);
    })();
  }, []);
  return timeBounds ? <App {...timeBounds}></App> : <div>Loading</div>;
};

export default AppWrapper;
