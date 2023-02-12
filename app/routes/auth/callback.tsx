import { LoaderArgs } from "@remix-run/node";
import { authenticator } from  "../../utils/auth.prisma";


export let loader = ({ request }: LoaderArgs) => {
  return authenticator.authenticate('google', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}

