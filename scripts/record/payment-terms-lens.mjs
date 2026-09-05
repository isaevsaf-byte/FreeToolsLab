// Shot list for the Payment Terms Lens video (content/videos/payment-terms-lens.md).
// Footage starts at 0 here; Remotion adds a 1.5 s title before it and a 2 s credit after.
export const query = "lang=en&theme=dark";

export async function steps({ goto, hold, note, tap, keys, scrollTo, download }) {
  await goto("/tools/payment-terms-lens/");
  await note("£1.2m a year. Terms 30 → 60.");
  await hold(2.5);

  await note("Your side.", { zoom: "[data-out='headline']", scale: 1.15 });
  await hold(4);

  await scrollTo("[data-visual]");
  await note("The supplier pays £11,836.");
  await hold(4);

  await keys("#sr", "ArrowRight", 12, 80, "Smaller supplier, dearer money.", { zoom: "[data-out='flyValR']", scale: 1.2 });
  await hold(3);

  await tap("[data-who='supplier']", "Now read it as the supplier.");
  await hold(3);

  await tap("#refine > summary");
  await tap("[data-preset='30,10,2']", "2% for 20 days is 37% a year.");
  await scrollTo("[data-out='apr']");
  await note(undefined, { zoom: "[data-out='apr']", scale: 1.25 });
  await hold(4);

  await download("[data-action='png']", "export.png", "Copy the picture into your next call.");
  await hold(3);
}
