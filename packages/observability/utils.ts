import { log } from "./log";

export function shouldSample(probability = 0.1) {
  return Math.random() < probability;
}

export function logPerf(event: string, data: Record<string, unknown>, sampleRate = 0.05) {
  if (shouldSample(sampleRate)) {
    log.info(`[Perf] ${event}`, data);
  }
}
