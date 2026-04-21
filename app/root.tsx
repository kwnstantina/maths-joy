import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data } from "@remix-run/node";  // instead of json
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import Footer from "components/footer/footer";
import NavList from "components/navs/navList";
import "./styles/app.css";
import LoadingPage from "components/loadingPage/loadingPage";
import { useState } from "react";
import usePrevious from "hooks/usePrevious";
import ErrorPage from "components/errorPage/errorPage";
import logo from "./assets/mathsLogo.png";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { i18nCookie } from "../services/cookies/cookies";
import useScrollToTop from "hooks/useScrollToTop";
import { getUser } from "~/utils/auth.prisma";

export interface RootUser {
  id: string;
  email: string;
  role: string;
  profile: { firstName: string; lastName: string } | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  let user: RootUser | null = null;

  try {
    const dbUser = await getUser(request);
    if (dbUser) {
      user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        profile: dbUser.profile
      };
    }
  } catch {
    // User not logged in or session expired
  }

  return data(
    {
      locale,
      ENV: { VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID },
      user
    },
    { headers: { "Set-Cookie": await i18nCookie.serialize(locale) } }
  );
}

export const handle = {
  i18n: ["common"],
};

export const meta: MetaFunction = () => {
  return [
    { charset: "utf-8" },
    { title: "Gregory Kirtsias - GregKyrMaths" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "description", content: "Mathematics exercises, tutorials, books and educational content by Gregory Kirtsias. Ασκήσεις μαθηματικών, βιβλία και εκπαιδευτικό υλικό." },
    { property: "og:title", content: "Gregory Kirtsias - GregKyrMaths" },
    { property: "og:description", content: "Mathematics exercises, tutorials, books and educational content" },
    { property: "og:type", content: "website" },
    { name: "robots", content: "index, follow" },
  ];
};

export function links() {
  return [{ rel: "icon", type: "image/png", href: logo }];
}

export default function App() {
  return (
    <Document>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </Document>
  );
}

interface DocumentProps {
  children: React.ReactNode;
}

function Document({ children }: DocumentProps) {
  const data = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  return (
    <html lang={data?.locale ?? "el"} dir={i18n.dir()}>
      <head>
        <Meta />
        <Links />
      </head>
      <body className="font-mono">
        {children}
        <ScrollRestoration />
        <Scripts />
        {data?.ENV && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
            }}
          />
        )}
      </body>
    </html>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const rootData = useLoaderData<typeof loader>();
  const [isLoading] = useState<boolean>(false);
  const prevPath = usePrevious(location.pathname);
  useScrollToTop({ location, prevPath: prevPath ?? "" });

  return (
    <div className="h-screen min-h-screen flex flex-col justify-start">
      <NavList user={rootData?.user ?? null} />
      {isLoading ? <LoadingPage /> : children}
      <Footer />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  console.error("Error:", errorMessage);

  return (
    <html lang="el">
      <head>
        <title>{`GregKyrMaths - Error ${errorStatus}`}</title>
        <Meta />
        <Links />
      </head>
      <body className="font-mono">
        <div className="h-screen min-h-screen flex flex-col justify-start">
          <NavList user={null} />
          <ErrorPage />
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
