import {
  ActionFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { logout,storage, getUserSession} from "~/utils/auth.prisma";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getUserSession(request);
 return redirect("/",{
 headers: {
  "Set-Cookie": await storage.destroySession(session),
  "Cookie": await storage.destroySession(session),
  "cookie": await storage.destroySession(session),
}});
};