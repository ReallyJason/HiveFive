import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: fontSans } = loadDMSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const { fontFamily: fontDisplay } = loadFraunces("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: fontMono } = loadJetBrainsMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export { fontSans, fontDisplay, fontMono };
