import React from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  Audio,
  staticFile,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Act1Hook } from "./acts/Act1Hook";
import { Act2Marketplace } from "./acts/Act2Marketplace";
import { Act3Infrastructure } from "./acts/Act3Infrastructure";
import { Act4Ecosystem } from "./acts/Act4Ecosystem";
import { Act5Close } from "./acts/Act5Close";
import "./styles/tailwind.css";

const TRANSITION_DURATION_FRAMES = 20;
const AUDIO_VOLUME = 0.15;

export const HiveFiveDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  const act1Duration = 40 * fps;
  const act2Duration = 50 * fps;
  const act3Duration = 70 * fps;
  const act4Duration = 60 * fps;
  const act5Duration = 20 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={act1Duration}>
          <Act1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={act2Duration}>
          <Act2Marketplace />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={act3Duration}>
          <Act3Infrastructure />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={act4Duration}>
          <Act4Ecosystem />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={act5Duration}>
          <Act5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Audio
        src={staticFile("audio/ambient-score.mp3")}
        volume={AUDIO_VOLUME}
        loop
      />
    </AbsoluteFill>
  );
};
