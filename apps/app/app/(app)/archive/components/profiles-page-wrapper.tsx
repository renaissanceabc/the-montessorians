import { Container } from "@/components/container";
import Contribute from "@/components/contribute";
import type { PastProfile } from "@/lib/content/types";

import PastProfilesList from "./past-profiles-list";

export const PastProfilesPageWrapper = ({ profiles }: { profiles: PastProfile[] }) => (
  <>
    <Container className="flex flex-col gap-8 pt-6 pb-12 lg:pt-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="type-title">Spotlight archive</h1>
        <p className="type-lead">The Montessorians featured on the home page, day by day.</p>
      </div>

      <PastProfilesList profiles={profiles} />
    </Container>

    <Contribute />
  </>
);
