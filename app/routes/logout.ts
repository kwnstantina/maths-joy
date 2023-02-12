import {
  ActionFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { json } from "react-router";
import { logout,storage, getUserSession, authenticator} from "~/utils/auth.prisma";

export const action: ActionFunction = async ({ request }) => { 
 await authenticator.logout(request, { redirectTo: "/login" });
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getUserSession(request);

 return redirect("/login",{
 headers: {
  "Set-Cookie": await storage.destroySession(session),
  "Cookie": await storage.destroySession(session),
  "cookie": await storage.destroySession(session),
}});

};