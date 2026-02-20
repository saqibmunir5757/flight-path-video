import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import mapConfig from "./mapConfig.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MapsVideo"
        component={MyComposition}
        durationInFrames={mapConfig.durationInFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
