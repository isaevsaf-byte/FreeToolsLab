import site from "@site/config.json";

/** Single source of truth: site/config.json (support links, contact, credit lines). */
export const SITE = site;

/** True when a config URL has been filled in (not a REPLACE_ME placeholder). */
export const isSet = (url?: string) => !!url && !/REPLACE_ME|YOUR_/.test(url);

export const LAB_CONFIG = {
  author: site.author.name,
  links: {
    linkedin: site.author.linkedin,
    email: `mailto:${site.author.email}`,
    submit: site.submit_tool,
    /** mailto: with a subject, for people without a GitHub account */
    submitEmail: `mailto:${site.author.email}?subject=${encodeURIComponent("Tool idea for FreeToolsLab")}`,
  },
};
