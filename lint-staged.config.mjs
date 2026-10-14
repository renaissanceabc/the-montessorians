// Vendored agent skills (bunx skills add) stay as published, so they're never
// linted or formatted. Ultracite errors when given only ignored files, so skip
// the run when nothing else is staged.
const VENDORED = /[\\/](?:\.agents|\.claude[\\/]skills)[\\/]/u;

const quote = (file) => JSON.stringify(file);

export default {
  "*.{ts,tsx,js,jsx,mjs,mts,json,jsonc,css,md}": (files) => {
    const own = files.filter((file) => !VENDORED.test(file));
    return own.length > 0 ? [`bunx ultracite fix ${own.map(quote).join(" ")}`] : [];
  },
  "data/**/*.yaml": ["oxfmt", "node scripts/validate.js"],
};
