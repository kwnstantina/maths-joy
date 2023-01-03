import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import Footer from "components/footer/footer";
import Main from "components/main/main";
import NavList from "components/navs/navList";
import styles from "./styles/app.css"

export function links() {
  return [{ rel: "stylesheet", href: styles }]
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  return (
    <Document>
    <Layout>
      <Outlet />
    </Layout>
  </Document >

  );
}


function Document({ children }: any) {
  return (
    <html lang="el">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
			<body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  )
}


export function Layout({ children }: any) {
  return (
    <>
    <NavList/>
      {children}
      <Footer/>
    </>
  )
}
