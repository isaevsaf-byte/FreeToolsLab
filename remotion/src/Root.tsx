import React from "react";
import { Composition } from "remotion";
import { Credit } from "./Credit";
import { ToolDemo } from "./ToolDemo";
import { VIDEO } from "./tokens";
import ptl from "../public/demo/payment-terms-lens.events.json";

const TITLE_SEC = 1.6;
const CREDIT_SEC = 2.2;

/** One <Composition> per tool video; the footage and the event log come from `npm run record <slug>`. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="payment-terms-lens"
      component={ToolDemo}
      durationInFrames={Math.round((TITLE_SEC + ptl.footage + CREDIT_SEC) * VIDEO.fps)}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{
        video: ptl.video,
        events: ptl.events,
        footage: ptl.footage,
        title: "Payment terms are a loan.",
        kicker: "Free tools for buyers · #1",
        url: "freetoolslab.org/tools/payment-terms-lens",
        credit: "Safar Isaev · FreeToolsLab",
        titleSec: TITLE_SEC,
        creditSec: CREDIT_SEC,
      }}
    />
    <Composition id="credit" component={Credit} durationInFrames={VIDEO.fps * 2} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{ line: "Safar Isaev · FreeToolsLab" }} />
  </>
);
