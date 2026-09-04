import { Composition } from "remotion";
import { Credit } from "./Credit";
import { VIDEO } from "./tokens";

/**
 * One <Composition> per tool video. Add them here; the script lives in content/videos/<slug>.md.
 * Composition ids match tool slugs (e.g. "payment-terms-lens").
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="credit"
      component={Credit}
      durationInFrames={VIDEO.fps * 2}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{ line: "Safar Isaev · FreeToolsLab" }}
    />
  </>
);
