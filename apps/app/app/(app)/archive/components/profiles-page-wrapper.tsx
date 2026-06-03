"use client";

import Contribute from "@/components/contribute";
import PastProfilesPaginatedList from "./past-profiles-list";

export function PastProfilesPageWrapper() {
  return (
    <>
      <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
            Spotlight Archive
          </h1>

          <PastProfilesPaginatedList />
        </div>
      </div>

      <Contribute />
    </>
  );
}
