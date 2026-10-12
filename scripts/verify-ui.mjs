#!/usr/bin/env node
/**
 * Smoke-tests the running site in a real browser with agent-browser: each key
 * page at desktop and phone widths must load with a title, raise no page or
 * console errors, and not scroll sideways. Saves a screenshot of every page to
 * .verify/ for review.
 *
 *   bun run verify:ui                       # against http://localhost:3010
 *   bun run verify:ui -- https://montessorians.localhost
 *   bun run verify:ui -- http://localhost:3010 /contribute /maria-montessori
 *
 * Start the app first (`cd apps/app && bun run dev:port`).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ROUTES = [
  "/",
  "/discover",
  "/alumni",
  "/contributors",
  "/organizations",
  "/organizations/association-montessori-internationale",
  "/maria-montessori",
  "/angeline-stoll-lillard",
  "/contribute",
  "/about",
  "/about/editorial-policy",
  "/data",
  "/tags",
  "/tags/writer",
  "/archive",
];

const VIEWPORTS = [
  { height: 800, name: "desktop", width: 1280 },
  { height: 812, name: "phone", width: 375 },
];

// Development-only console noise that isn't a problem with the page.
const IGNORED_CONSOLE = [/webpack-hmr/u, /Download the React DevTools/u];

const OUT_DIR = path.join(import.meta.dirname, "..", ".verify");

const [baseUrl = "http://localhost:3010", ...routeArgs] = process.argv.slice(2);
const routes = routeArgs.length > 0 ? routeArgs : DEFAULT_ROUTES;

// One named session, so this never drives a browser another agent is using.
const env = { ...process.env, AGENT_BROWSER_SESSION: `verify-ui-${process.pid}` };

const run = (...args) =>
  execFileSync("agent-browser", args, { encoding: "utf-8", env, stdio: "pipe" }).trim();

const pageState = () =>
  JSON.parse(
    JSON.parse(
      run(
        "eval",
        "JSON.stringify({ overflow: document.documentElement.scrollWidth - innerWidth, title: document.title })"
      )
    )
  );

const consoleErrors = () =>
  run("console")
    .split("\n")
    .filter((line) => line.startsWith("[error]"))
    .filter((line) => !IGNORED_CONSOLE.some((pattern) => pattern.test(line)));

const checkRoute = (route, viewport) => {
  run("errors", "--clear");
  run("console", "--clear");
  run("open", new URL(route, baseUrl).href);
  run("wait", "--load", "networkidle");
  const problems = [];
  const state = pageState();
  if (!state.title || /404|not found/iu.test(state.title)) {
    problems.push(`bad title: "${state.title}"`);
  }
  if (state.overflow > 0) {
    problems.push(`scrolls sideways by ${state.overflow}px`);
  }
  const pageErrors = run("errors");
  if (pageErrors) {
    problems.push(`page errors:\n      ${pageErrors.replaceAll("\n", "\n      ")}`);
  }
  for (const line of consoleErrors()) {
    problems.push(`console: ${line}`);
  }
  const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "__");
  run("screenshot", path.join(OUT_DIR, viewport.name, `${slug}.png`));
  return problems;
};

fs.mkdirSync(path.join(OUT_DIR, "desktop"), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, "phone"), { recursive: true });

let failures = 0;
try {
  for (const viewport of VIEWPORTS) {
    run("set", "viewport", String(viewport.width), String(viewport.height));
    for (const route of routes) {
      const problems = checkRoute(route, viewport);
      const label = `${viewport.name.padEnd(7)} ${route}`;
      if (problems.length > 0) {
        failures += 1;
        console.error(`✖ ${label}\n    ${problems.join("\n    ")}`);
      } else {
        console.log(`✓ ${label}`);
      }
    }
  }
} finally {
  run("close");
}

console.log(`\nScreenshots: ${path.relative(process.cwd(), OUT_DIR)}/`);
if (failures > 0) {
  console.error(`${failures} page check(s) failed`);
  process.exit(1);
}
