// Shot list for the Sourcing Cockpit video (content/videos/sourcing-cockpit.md).
// The page is a Claude artifact kept in content/artifacts/, served from the repo root.
// Footage starts at 0 here; Remotion adds a 2 s title before it and a 2 s credit after.
export const query = "theme=dark&seed=negotiation";

export async function steps({ goto, hold, note, tap, fill, waitFor, scrollTo }) {
  await goto("/content/artifacts/sourcing-cockpit.html");
  await note("One link. The whole sourcing project.", { zoom: ".ring", scale: 1.15 });
  await hold(4);

  await scrollTo("#stages", "start");
  await note("Six stages. Six vendors. One number.");
  await hold(4);

  await tap("[data-slip='4']", "Legal slipped a week. Log it.");
  await fill("[data-box='4'] input", 7);
  await tap("[data-apply='4']");
  await hold(1.5);
  await scrollTo(".asof", "center");
  await note("The award date moves. Nobody rewrites a slide.", { zoom: "#days", scale: 1.15 });
  await hold(4.5);

  await scrollTo("#gantt");
  await note("Plan vs actual. The slip is red.");
  await hold(3.5);

  await tap("[data-sup='0:5']", "Award. The list becomes a recommendation.");
  await hold(0.8);
  await scrollTo("#award");
  await note(undefined, { zoom: "#award", scale: 1.15 });
  await hold(4.5);

  await tap("[data-sign='Legal']", "Legal signed. One click.");
  await hold(3);

  await tap("#snap", "One PNG for the steering email.");
  await hold(1.2);
  await note(undefined, { zoom: "#shot .box", scale: 1.25 });
  await waitFor("#shot.open");
  await hold(4);
  await tap("#shotClose");

  await scrollTo(".how .prompt");
  await note("keep this dashboard updated from my Friday notes", { zoom: ".how .prompt", scale: 1.2 });
  await hold(4.5);
}
