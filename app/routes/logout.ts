import {
  ActionFunction,
  LoaderFunction,
  redirect,

} from "@remix-run/node";
import { logout } from "~/utils/auth.prisma";

export let action: ActionFunction = async ({ request }) => {
  return logout(request);
};

export let loader: LoaderFunction = async () => {
  return redirect("/");
};