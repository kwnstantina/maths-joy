import { ActionArgs,redirect } from "@remix-run/node";
import { authenticator } from  '../../utils/auth.prisma';

export let loader = () => redirect('/')

export let action = ({ request }: ActionArgs) => {
  return authenticator.authenticate('google', request)
}