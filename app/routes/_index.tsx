import { useState } from "react";
import AboutUsHoc from "components/aboutUs/aboutUs";
import Intro from "components/intro/intro";
import NewsLetter from "components/newsletter/newsletter";
import type { ActionFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import { useFetcher, Link } from "@remix-run/react";
import { validateEmail } from "~/utils/validators.server";
import { useTranslation } from "react-i18next";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email") as string;
  if (!email || !validateEmail(email)) {
    return data({
      error: "Παρακαλώ εισάγετε ένα έγκυρο email"
    });
  }
  const convertApiKit = process.env.CONVERTKIT_API_KEY;
  const converFormId = process.env.CONVERT_API_TEMPLATE_ID;
  const res = await fetch(`https://api.convertkit.com/v3/forms/${converFormId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({
      api_key: convertApiKit,
      email: email,
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

  return await res.json();
};

// Feature Section Component
interface FeatureSectionProps {
  titleKey: string;
  descriptionKey: string;
  linkKey: string;
  linkTo: string;
  accentColor: string;
  reversed?: boolean;
  imageSrc?: string;
}

function FeatureSection({
  titleKey,
  descriptionKey,
  linkKey,
  linkTo,
  accentColor,
  reversed = false,
  imageSrc
}: FeatureSectionProps): JSX.Element {
  const { t } = useTranslation();

  const bgColors: Record<string, string> = {
    orange: "bg-orange-500",
    pink: "bg-pink-500",
    blue: "bg-blue-500",
    teal: "bg-teal-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
  };

  const hoverColors: Record<string, string> = {
    orange: "hover:text-orange-600",
    pink: "hover:text-pink-600",
    blue: "hover:text-blue-600",
    teal: "hover:text-teal-600",
    purple: "hover:text-purple-600",
    green: "hover:text-green-600",
  };

  const bgColor = bgColors[accentColor] || "bg-orange-500";
  const hoverColor = hoverColors[accentColor] || "hover:text-orange-600";
  const flexDirection = reversed ? "md:flex-row-reverse" : "md:flex-row";

  return (
    <section className="py-16 md:py-20">
      <div className={`max-w-6xl mx-auto px-6 flex flex-col ${flexDirection} items-center gap-8 md:gap-12`}>
        {/* Content Side */}
        <div className="flex-1 space-y-5">
          <div className={`w-12 h-1 ${bgColor}`} />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t(titleKey)}
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            {t(descriptionKey)}
          </p>
          <Link
            to={linkTo}
            className={`inline-flex items-center text-gray-900 font-medium ${hoverColor} transition-colors`}
          >
            {t(linkKey)}
            <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Image Side */}
        {imageSrc ? (
          <div className="flex-1 flex justify-center">
            <img
              src={imageSrc}
              alt=""
              className="w-full max-w-sm rounded-lg"
            />
          </div>
        ) : (
          <div className="flex-1 hidden md:block" />
        )}
      </div>
    </section>
  );
}

export default function Index() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const fetcher = useFetcher();

  const subscribe = (email: string) => {
    setNewsletterEmail(email);
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement | any> | any
  ) => {
    event.preventDefault();
    fetcher.submit({ email: newsletterEmail }, { method: "post" });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="px-6 text-center pb-8 flex justify-center align-center">
        <Intro />
      </section>

      {/* Feature Sections - Alternating Layout */}
      <div className="bg-gray-50">
        <FeatureSection
          titleKey="features.exercises.title"
          descriptionKey="features.exercises.description"
          linkKey="features.exercises.link"
          linkTo="/exercises"
          accentColor="orange"
          reversed={false}
        />
      </div>

      <FeatureSection
        titleKey="features.tutorials.title"
        descriptionKey="features.tutorials.description"
        linkKey="features.tutorials.link"
        linkTo="/videos"
        accentColor="pink"
        reversed={true}
      />

      <div className="bg-gray-50">
        <FeatureSection
          titleKey="features.books.title"
          descriptionKey="features.books.description"
          linkKey="features.books.link"
          linkTo="/books"
          accentColor="blue"
          reversed={false}
        />
      </div>

      <FeatureSection
        titleKey="features.training.title"
        descriptionKey="features.training.description"
        linkKey="features.training.link"
        linkTo="/testYourself"
        accentColor="teal"
        reversed={true}
      />

      <div className="bg-gray-50">
        <FeatureSection
          titleKey="features.qa.title"
          descriptionKey="features.qa.description"
          linkKey="features.qa.link"
          linkTo="/qa"
          accentColor="purple"
          reversed={false}
        />
      </div>

      {/* About Us Section */}
      <section>
        <AboutUsHoc />
      </section>

      {/* Newsletter Section */}
      <section className="bg-white my-20">
        <NewsLetter
          subscribe={subscribe}
          newsletterEmail={newsletterEmail}
          handleSubmit={handleSubmit}
          fetcher={fetcher}
        />
      </section>
    </>
  );
}
