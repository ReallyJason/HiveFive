import { Composition } from "remotion";
import { HiveFiveDemo } from "./Video";
import "./styles/tailwind.css";

const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;
const FRAMES_PER_SECOND = 30;
// (40+50+70+60+20)*30 = 7200 raw frames minus 4 transitions of 20 frames = 7120
const TOTAL_FRAMES = 7120;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HiveFiveDemo"
      component={HiveFiveDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FRAMES_PER_SECOND}
      width={COMPOSITION_WIDTH}
      height={COMPOSITION_HEIGHT}
    />
  );
};
