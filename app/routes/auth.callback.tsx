import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/utils/auth.prisma";

export const loader = ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate('google', request, {
    // /consent bounces straight on to "/" when consent is already complete
    successRedirect: '/consent',
    failureRedirect: '/login',
  })
}

