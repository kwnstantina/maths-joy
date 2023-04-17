import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import Footer from "components/footer/footer";
import NavList from "components/navs/navList";
import styles from "./styles/app.css";
import LoadingPage from "components/loadingPage/loadingPage";
import { useEffect, useState } from "react";
import usePrevious from "hooks/usePrevious";

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

  return (
    <html lang="el">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="font-mono">
       {children}
        <ScrollRestoration />
        <Scripts />
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
    if ((location.pathname !== prevPath) && location.pathname!=='/' ) {
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
      {isLoading? <LoadingPage/>: children}
      <Footer />
    </div>
  );
}
