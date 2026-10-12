import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { ContributeForm } from "./components/contribute-form";

export const generateMetadata = () => {
  return createMetadata({
    title: "Add a Montessorian",
    description:
      "Suggest a Montessori alum or someone who contributed to the field. No account needed.",
    alternates: {
      canonical: `${siteUrl}/contribute`,
    },
  });
};

export default function Contribute() {
  return (
    <div className="container mx-auto max-w-2xl px-4 pt-8 pb-16 sm:px-8 lg:pt-0">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-bold font-serif text-4xl lg:text-5xl">Add a Montessorian</h1>
        <p className="text-muted-foreground">
          Fill in what you know. No account needed. We review every submission before it's
          published.
        </p>
      </div>
      <ContributeForm />
    </div>
  );
}
