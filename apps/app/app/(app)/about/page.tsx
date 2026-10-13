import Link from "next/link";

import Contribute from "@/components/contribute";
import { getDirectoryCounts } from "@/lib/content/directory";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/about`,
    },
    description:
      "About The Montessorians, an open directory and name authority for Montessori alumni and the people who shaped the field.",
    title: "About",
  });

const About = () => {
  const counts = getDirectoryCounts();
  const works = getAllProfiles().reduce((sum, p) => sum + p.contributions.length, 0);
  return (
    <div className="container mx-auto max-w-3xl items-center justify-between gap-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full space-y-8 pt-12">
        <h1 className="flex w-full justify-center font-serif text-4xl font-bold lg:text-5xl">
          About us
        </h1>

        <div className="prose prose-stone prose-code:before:content-none prose-code:after:content-none">
          <p className="lead text-primary">
            <strong className="text-primary">The Montessorians</strong> is the largest open
            directory of people shaped by Montessori, and of the people who shaped it.
          </p>

          <p>
            Some went to a Montessori school as kids and grew up to found Google, win a Pulitzer, or
            play cello for presidents. Others spent their careers on Montessori itself, starting
            with Maria Montessori, who opened her first classroom in a Rome tenement in 1907. The
            researchers, writers, and teacher trainers who carried her work forward are here too.
          </p>

          <p>
            You can check everything we publish. Each person has a permanent ID and the sources
            behind their entry, so a librarian, a researcher, or a curious parent can cite them with
            confidence. Read{" "}
            <Link className="underline" href="/about/editorial-policy">
              how we decide who belongs here
            </Link>
            , or{" "}
            <Link className="underline" href="/data">
              download the whole dataset
            </Link>
            .
          </p>

          <p>
            So far, that’s {counts.all} people, {counts.organizations} schools and organizations,
            and {works} books, papers, and lectures.
          </p>

          <p>
            <Link className="underline" href="https://renaissance.education">
              Renaissance
            </Link>{" "}
            made The Montessorians, and it’s open source. The data is in the public domain under{" "}
            <Link
              className="underline"
              href="https://github.com/renaissanceabc/the-montessorians/blob/main/LICENSE.md"
            >
              CC0
            </Link>
            , so take it and build something. Know someone who belongs here?{" "}
            <Link className="underline" href="/contribute">
              Add them
            </Link>
            .
          </p>

          <h3>What is Montessori?</h3>

          <p>
            Pioneered by{" "}
            <Link className="underline" href="https://en.wikipedia.org/wiki/Maria_Montessori">
              Maria Montessori
            </Link>
            , the Montessori method is a progressive educational approach that emphasizes
            children&apos;s natural interests and activities, rather than traditional teaching
            methods. Montessori classrooms focus on hands-on learning and developing real-world
            skills.
          </p>

          <p>
            Notable features of the Montessori method include mixed-age classrooms, student freedom
            (including their choice of activity), long blocks of uninterrupted work time, specially
            trained teachers, and a prepared environment.
          </p>

          <blockquote className="border-l-primary">
            “The greatest sign of success for a teacher is to be able to say, ‘The children are now
            working as if I did not exist.’” – Maria Montessori
          </blockquote>

          <h3>Our Mission</h3>

          <p>
            Montessori has been around for more than a century, yet most parents first hear about it
            secondhand: a famous name, or a neighbor’s kid. We want to show where it leads, and
            where its ideas come from.
          </p>

          <p>
            Although we have transformed how we bank, shop, and work... school and education largely
            remains the same as it did 150 years ago. And in today&apos;s fast-changing world that
            has already been reshaped by the advent of AI, we need to rethink how we educate our
            children.
          </p>

          <p>
            We believe this begins with choice and discovery. With an understanding of the options
            available. With this, we can begin to make informed, intentional decisions around our
            children&apos;s education.
          </p>

          <p>
            When we went looking for notable Montessori alumni, we found plenty of lists. Few cited
            a source, and most copied each other. And no one was keeping track of the people behind
            the method at all.
          </p>

          <p>
            So we’re building the first and largest open record of both, one you can cite, check,
            and add to.
          </p>
        </div>

        <Contribute />
      </div>
    </div>
  );
};
export default About;
