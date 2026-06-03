import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type DailyEmailTemplateProps = {
  readonly unsubscribeUrl: string;
  readonly profile: {
    readonly slug: string;
    readonly name: string;
    readonly tagline: string;
    readonly bio: string;
    readonly notableAchievements: string[];
    readonly education: string[];
    readonly educationNotes: string;
    readonly quotes: string[];
    readonly imageUrl: string;
  };
};

export const DailyEmailTemplate = ({ unsubscribeUrl, profile }: DailyEmailTemplateProps) => (
  <Tailwind
    config={{
      theme: {
        extend: {
          colors: {
            background: "#f0e8de",
            brand: "#275239",
            secondary: "#404040",
          },
        },
      },
    }}
  >
    <Html>
      <Head />
      <Preview>Welcome to The Montessorians</Preview>
      <Body className="bg-background font-sans">
        <Container className="mx-auto">
          <Section className="rounded-t-md bg-brand">
            <Img
              alt="The Montessorians"
              className="mx-0 my-0 h-auto w-full"
              src={
                "https://4o0qv6s71o9956zk.public.blob.vercel-storage.com/email/logo-A6xXL74jzP2IChR8nzHt62UlDOyXKm.jpg"
              }
            />
          </Section>

          <Section className="rounded-[5px] bg-white p-8">
            <Heading className="mt-0 text-center text-2xl leading-8">
              Today's Montessori Story
            </Heading>

            <Img
              alt={profile.name}
              className="mx-auto my-5 h-auto w-[240px] rounded-full"
              src={profile.imageUrl}
            />

            <Section>
              <Row>
                <Text className="text-center font-semibold text-3xl">
                  <Link
                    className="text-black"
                    href={`https://themontessorians.xyz/${profile.slug}`}
                  >
                    {profile.name}
                  </Link>
                </Text>

                {profile.tagline && (
                  <Text className="text-center text-base text-stone-500 italic">
                    {profile.tagline}
                  </Text>
                )}

                {profile.bio && (
                  <Text className="text-base">
                    <strong>Bio:</strong> {profile.bio}
                  </Text>
                )}

                {profile.educationNotes && (
                  <Text className="text-base">
                    <strong>Notes:</strong> {profile.educationNotes}
                  </Text>
                )}
              </Row>
            </Section>

            {profile.notableAchievements?.length > 0 && (
              <>
                <Text className="text-base">
                  <strong>Notable Achievements:</strong>
                </Text>
                <ul>
                  {profile.notableAchievements?.map((achievement) => (
                    <li className="mb-2 text-base" key={achievement}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Section className="my-10 text-center">
              <Row>
                <Button
                  className="rounded-md bg-brand px-6 py-3 text-white"
                  href={`https://themontessorians.xyz/${profile.slug}`}
                >
                  Read more
                </Button>
              </Row>
            </Section>

            <Hr className="my-4" />

            <Section className="my-10 text-center">
              <Row>
                <Text className="mt-0 mb-5 text-base">
                  <strong>The Montessorians</strong> is the largest open source dataset of
                  extraordinary Montessori alumni who've gone on to do great things.{" "}
                  <Link className="mt-2 text-brand" href="https://renaissance.education">
                    Made by Renaissance
                  </Link>
                </Text>

                <Button
                  className="rounded-md bg-secondary px-6 py-3 text-white"
                  href="https://themontessorians.xyz"
                >
                  Explore The Montessorian
                </Button>
              </Row>
            </Section>

            <Hr className="my-4" />
            <Text className="text-center text-xs text-zinc-500">
              You can{" "}
              <Link className="text-zinc-500 underline" href={unsubscribeUrl}>
                unsubscribe
              </Link>{" "}
              at any time.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

const ExampleDailyEmail = () => (
  <DailyEmailTemplate
    profile={{
      slug: "yo-yo-ma",
      name: "Yo-Yo Ma",
      tagline:
        "World-renowned cellist, United Nations Peace Ambassador, and winner of 19 Grammy Awards",
      bio: "Yo-Yo Ma is an acclaimed American cellist known for his extraordinary technique and deep musicality. A cultural ambassador and humanitarian, he has performed around the world and founded the Silk Road Ensemble to foster cross-cultural collaboration through music.",
      notableAchievements: [
        "19-time Grammy Award winner",
        "Founder of the Silk Road Ensemble",
        "Presidential Medal of Freedom recipient",
      ],
      education: ["montessori"],
      educationNotes:
        "Yo-Yo Ma attended a Montessori school as a young child, where his artistic sensibilities and self-motivation were nurtured through exploration.",
      quotes: [],
      imageUrl:
        "https://4o0qv6s71o9956zk.public.blob.vercel-storage.com/images/profiles/yo-yo-ma.jpg",
    }}
    unsubscribeUrl="https://themontessorians.xyz/unsubscribe"
  />
);

export default ExampleDailyEmail;
