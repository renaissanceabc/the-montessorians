import Link from "next/link";
import {
  getAllOrganizations,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () => {
  return createMetadata({
    title: "Organizations",
    description:
      "Montessori schools, training centers, universities, and associations connected to The Montessorians.",
    alternates: {
      canonical: `${siteUrl}/organizations`,
    },
  });
};

export default function Organizations() {
  const organizations = getAllOrganizations();

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-bold font-serif text-4xl lg:text-5xl">Organizations</h1>
          <p className="text-muted-foreground text-sm">
            Schools, training centers, universities, and associations that Montessorians attended or
            are affiliated with.
          </p>
        </div>

        {organizations.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm italic">No organizations yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {organizations.map((org) => {
              const count = getOrganizationMembers(org.slug).length;
              return (
                <li key={org.slug}>
                  <Link
                    className="group flex items-baseline justify-between gap-4 rounded-lg border border-transparent p-4 transition-all hover:border-black/10 hover:bg-white"
                    href={`/organizations/${org.slug}`}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="font-semibold font-serif text-2xl group-hover:text-primary">
                        {org.name}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {[ORGANIZATION_TYPE_LABELS[org.type], org.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground text-sm">
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
