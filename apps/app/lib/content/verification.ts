import type { Verification } from "./types";

// Plain module (not "use client") so server pages can read the copy too.

export const POLICY_HREF = "/about/editorial-policy";

export const VERIFICATION_COPY: Record<Verification, { label: string; description: string }> = {
  confirmed: {
    description: "Confirmed directly by the person, or by our maintainers.",
    label: "Confirmed",
  },
  reported: {
    description:
      "Shared from personal knowledge or a self-published post; not yet independently checked.",
    label: "Reported",
  },
  unverified: {
    description:
      "Widely listed, but we haven't found a reliable source yet. Know one? Suggest a correction.",
    label: "Unverified",
  },
  verified: {
    description: "A published source supports the Montessori connection.",
    label: "Verified",
  },
};
