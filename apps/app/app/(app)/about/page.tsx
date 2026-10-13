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
            directory of the people of Montessori: alumni who’ve gone on to do great things, and the
            researchers, authors, founders, and trainers who shaped the field.
          </p>

          <p>
            We document two kinds of people. <strong>Alumni</strong> attended a Montessori school
            and went on to remarkable lives, from famous figures to extraordinary everyday people.{" "}
            <strong>Contributors</strong> shaped how Montessori is understood and practiced through
            research, writing, and teacher training, from Maria Montessori herself to today’s
            scholars. Someone can be both.
          </p>

          <p>
            Every person and organization has a permanent identifier and a cited source, so
            libraries, researchers, and other projects can link to it. See the{" "}
            <Link className="underline" href="/about/editorial-policy">
              editorial policy
            </Link>{" "}
            for who we include and how we verify, and{" "}
            <Link className="underline" href="/data">
              Data &amp; API
            </Link>{" "}
            to use the data.
          </p>

          <p>
            Today that’s <strong>{counts.all} people</strong> ({counts.alumni} alumni,{" "}
            {counts.contributors} contributors) and{" "}
            <strong>{counts.organizations} organizations</strong>, with{" "}
            <strong>{works} documented works</strong>.
          </p>

          <p>
            Created by{" "}
            <Link className="underline" href="https://renaissance.education">
              Renaissance
            </Link>
            , The Montessorians is open source and community-driven. The data is dedicated to the
            public domain under{" "}
            <Link
              className="underline"
              href="https://github.com/renaissanceabc/the-montessorians/blob/main/LICENSE.md"
            >
              CC0
            </Link>
            , and anyone can{" "}
            <Link className="underline" href="/contribute">
              suggest someone
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
            Beyond spotlighting what Montessori alumni have done, we want to make the evidence and
            thinking behind Montessori easier to find: who studied it, what they found, and where
            it’s taught. Together, we hope that offers a clearer picture of what education outside
            the conventional school system can do.
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
            In our search for notable alumni, and for the people behind the method, we found no
            single place that brought them together.
          </p>

          <p>
            We’re building that: the first and largest open, citable record of the Montessori alumni
            and contributors who’ve shaped the world, and the field itself.
          </p>
        </div>

        <Contribute />
      </div>
    </div>
  );
};
export default About;
