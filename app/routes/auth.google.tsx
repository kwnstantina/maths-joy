import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.prisma";

export const loader = () => redirect("/");

export const action = ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate('google', request)
}