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

type SubscribeEmailTemplateProps = {
  readonly unsubscribeUrl: string;
};

export const SubscribeEmailTemplate = ({ unsubscribeUrl }: SubscribeEmailTemplateProps) => (
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
            <Link href="https://themontessorians.xyz">
              <Img
                alt="The Montessorians Logo"
                className="mx-0 my-0 h-auto w-full"
                src={
                  "https://4o0qv6s71o9956zk.public.blob.vercel-storage.com/email/logo-A6xXL74jzP2IChR8nzHt62UlDOyXKm.jpg"
                }
              />
            </Link>
          </Section>

          <Section className="rounded-[5px] bg-white p-8">
            <Link href="https://themontessorians.xyz">
              <Img
                alt="The Montessorians Preview"
                className="mx-auto my-0 h-auto w-full"
                src={
                  "https://4o0qv6s71o9956zk.public.blob.vercel-storage.com/email/preview-HqFyrSk3Sjrd4BSRThNeNm30t3ETv0.png"
                }
              />
            </Link>

            <Heading className="mt-10 mb-2 text-center text-2xl leading-8">
              Welcome to The Montessorians
            </Heading>

            <Section>
              <Row>
                <Text className="text-base">
                  Congratulations! You're joining a growing community around the world who are
                  passionate about Montessori and alternative education.
                </Text>

                <Text className="text-base">Explore The Montessorians:</Text>
              </Row>
            </Section>

            <ul>{steps?.map(({ Description }) => Description)}</ul>

            <Section className="my-10 text-center">
              <Row>
                <Button
                  className="rounded-md bg-brand px-6 py-3 text-white"
                  href="https://themontessorians.xyz"
                >
                  Discover Montessori stories
                </Button>
              </Row>
            </Section>

            <Hr className="my-4" />

            <Section className="mt-0">
              <Row>
                <Text className="my-0 text-stone-500 text-xs">
                  <strong>The Montessorians</strong> is the largest open source dataset of
                  extraordinary Montessori alumni who've gone on to do great things.{" "}
                  <Link className="mt-2 text-brand" href="https://renaissance.education">
                    Made by Renaissance
                  </Link>
                </Text>
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

const ExampleContactEmail = () => (
  <SubscribeEmailTemplate unsubscribeUrl="https://themontessorians.xyz/unsubscribe" />
);

export default ExampleContactEmail;

const steps = [
  {
    id: 1,
    Description: (
      <li className="mb-4 text-base leading-6" key={1}>
        <strong>Read stories from Montessori alumni.</strong> We're spotlighting and documenting the
        achievements of extraordinary Montessorians.{" "}
        <Link href="https://themontessorians.xyz">Explore the directory</Link>.
      </li>
    ),
  },
  {
    id: 2,
    Description: (
      <li className="mb-4 text-base leading-6" key={2}>
        <strong>Share your story.</strong> The Montessorians is the world's first and largest open
        source dataset of Montessorians.{" "}
        <Link href="https://github.com/renaissanceabc/the-montessorians">
          Contribute your alumni story
        </Link>
        .
      </li>
    ),
  },
];
