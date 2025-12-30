import {
  ActionFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {sessionStorage, getUserSession, authenticator, getUserByGoogleAuth, updateUserStatus, getUserId} from "~/utils/auth.prisma";

export const action: ActionFunction = async ({ request }) => { 
 await authenticator.logout(request, { redirectTo: "/login" });
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getUserSession(request);
  const userId =  await getUserByGoogleAuth(request);
  const userSessionId = await getUserId(request);
  await updateUserStatus(userId?.id ?? userSessionId,false);

 return redirect("/login",{
 headers: {
  "Set-Cookie": await sessionStorage.destroySession(session),
  "Cookie": await sessionStorage.destroySession(session),
  "cookie": await sessionStorage.destroySession(session),
}});

};