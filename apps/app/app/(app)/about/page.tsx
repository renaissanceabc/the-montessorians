import Link from "next/link";
import Contribute from "@/components/contribute";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () => {
  return createMetadata({
    title: "About",
    description: "About The Montessorians, an open source directory of Montessori alumni.",
    alternates: {
      canonical: `${siteUrl}/about`,
    },
  });
};

export default function About() {
  return (
    <div className="container mx-auto max-w-3xl items-center justify-between gap-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full space-y-8 pt-12">
        <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
          About us
        </h1>

        <div className="prose prose-stone">
          <p className="lead text-primary">
            <strong className="text-primary">The Montessorians</strong> is the largest open source
            dataset of Montessori alumni who've gone on to do great things.
          </p>

          <p>
            The Montessorians is a project that aims to celebrate and document the achievements of
            individuals who were influenced by Montessori. An alternative method to public school,
            Montessori has led to extraordinary outcomes as evidenced by the many pioneers,
            innovators, and trailblazers who we strive to chronicle on{" "}
            <Link className="underline" href="/discover">
              The Montessorians
            </Link>
            .
          </p>

          <p>
            Created by{" "}
            <Link className="underline" href="https://renaissance.education">
              Renaissance
            </Link>
            , an education startup studio, The Montessorians is fully open source and
            community-driven. It is open for contributions under a{" "}
            <Link
              className="underline"
              href="https://github.com/renaissanceabc/the-montessorians/blob/main/LICENSE.md"
            >
              Creative Commons CC0 license
            </Link>
            .
          </p>

          <h3>What is Montessori?</h3>

          <p>
            Pioneered by{" "}
            <Link className="underline" href="https://en.wikipedia.org/wiki/Maria_Montessori">
              Maria Montessori
            </Link>
            , the Montessori method is a progressive educational approach that emphasizes children's
            natural interests and activities, rather than traditional teaching methods. Montessori
            classrooms focus on hands-on learning and developing real-world skills.
          </p>

          <p>
            Notable features of the Montessori method include mixed-age classrooms, student freedom
            (including their choice of activity), long blocks of uninterrupted work time, specially
            trained teachers, and a prepared environment.
          </p>

          <blockquote className="border-l-primary">
            “The greatest sign of success for a teacher is to be able to say, "The children are now
            working as if I did not exist.” – Maria Montessori
          </blockquote>

          <h3>Our Mission</h3>

          <p>
            Beyond spotlighting the achievements of Montessori alumni — which spans beyond famous
            figures to include extraordinary everyday people — we hope to offer a greater
            understanding of the potential of alternative education outside of the public school
            system.
          </p>

          <p>
            Although we have transformed how we bank, shop, and work... school and education largely
            remains the same as it did 150 years ago. And in today's fast-changing world that has
            already been reshaped by the advent of AI, we need to rethink how we educate our
            children.
          </p>

          <p>
            We believe this begins with choice and discovery. With an understanding of the options
            available. With this, we can begin to make informed, intentional decisions around our
            children's education.
          </p>

          <p>
            In our search for notable alumni who have been through alternative pathways to education
            (such as Montessori), we found there was no comprehensive source of information.
          </p>

          <p>
            We hope to change that with the first and largest open source dataset of Montessori
            alumni.
          </p>
        </div>

        <Contribute />
      </div>
    </div>
  );
}
