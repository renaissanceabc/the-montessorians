import type { Verification } from "./types";

// Plain module (not "use client") so server pages can read the copy too.

export const POLICY_HREF = "/about/editorial-policy";

export const VERIFICATION_COPY: Record<Verification, { label: string; description: string }> = {
  verified: {
    label: "Verified",
    description: "A published source supports the Montessori connection.",
  },
  confirmed: {
    label: "Confirmed",
    description: "Confirmed directly by the person, or by our maintainers.",
  },
  reported: {
    label: "Reported",
    description:
      "Shared from personal knowledge or a self-published post; not yet independently checked.",
  },
  unverified: {
    label: "Unverified",
    description:
      "Widely listed, but we haven't found a reliable source yet. Know one? Suggest a correction.",
  },
};
