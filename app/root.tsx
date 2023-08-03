import { json, type LoaderArgs, type MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import Footer from "components/footer/footer";
import NavList from "components/navs/navList";
import styles from "./styles/app.css";
import LoadingPage from "components/loadingPage/loadingPage";
import { useEffect, useState } from "react";
import usePrevious from "hooks/usePrevious";
import { Analytics } from "@vercel/analytics/react";
import ErrorPage from "components/errorPage/errorPage";
import logo from './assets/mathsLogo.png';
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

export async function loader({ request }: LoaderArgs) {
  let locale = await i18next.getLocale(request);
  return {
    locale: locale,
    ENV: {
    VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID,
  },
}
}

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: ["common"],
};

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}
  
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Gregory Kirtsias",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

function Document({ children }: any) {
  const { ENV ,locale} = useLoaderData<typeof loader>();
  let { i18n } = useTranslation();

  return (
    <html lang={locale as any} dir={i18n.dir()}>
      <head>
      <title>GregKyrMaths</title>
        <Meta />
        <Links />
        <link rel="icon" type="image/x-icon" href={logo}/>
      </head>
      <body className="font-mono">
        {children}
        <ScrollRestoration />
        <Scripts />
        {/* <Analytics /> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function Layout({ children }: any) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const prevPath = usePrevious(location.pathname);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (location.pathname !== prevPath && location.pathname !== "/") {
      setIsLoading(true);
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [location.pathname, prevPath]);  

  return (
    <div className="h-screen min-h-screen flex flex-col justify-start ">
      <NavList />
      {isLoading ? <LoadingPage /> : children}
      <Footer />
    </div>
  );
}

export function ErrorBoundary({ error: error }: { error: Error }) {
  console.error('error',error);
  return (
    <html>
      <head>
        <title>GregKyrMaths error!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="h-screen min-h-screen flex flex-col justify-start ">
          <NavList />
          <ErrorPage />
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
