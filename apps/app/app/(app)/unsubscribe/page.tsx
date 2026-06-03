import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import UnsubscribeClientContent from "./components/unsubscribe-content";

export const generateMetadata = () => {
  return createMetadata({
    title: "Unsubscribe",
    description: "Unsubscribe from The Montessorians.",
    alternates: {
      canonical: `${siteUrl}/unsubscribe`,
    },
  });
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="container mx-auto max-w-3xl items-center justify-between gap-10 px-4 sm:px-6 lg:px-8">
      <UnsubscribeClientContent token={token} />
    </div>
  );
}
