import { log } from "./log";

/** Structured fields attached to a sampled performance log line. */
export type PerfData = Record<string, string | number | boolean | null | undefined>;

export const shouldSample = (probability = 0.1) => Math.random() < probability;

export const logPerf = (event: string, data: PerfData, sampleRate = 0.05) => {
  if (shouldSample(sampleRate)) {
    log.info(`[Perf] ${event}`, data);
  }
};
