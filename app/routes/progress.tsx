import {useLoaderData } from "@remix-run/react";
import { json,LoaderFunction ,redirect} from '@remix-run/node';
import {getUser} from '~/utils/auth.prisma';
export const loader: LoaderFunction = async ({ request }) => {
    let user = await getUser(request)
    return json(user)
  };

export default function Progress() {
    const user = useLoaderData<typeof loader>();

  return (
    <>
    <section>
    <div className="container mx-auto px-6 text-center pb-52">      
        <h1
          className="max-w-2xl mx-auto mb-10 text-3xl font-bold leading-normal  md:text-4xl"
        >
        Η πρόοδος σας {user && user['profile']? ','+user.profile.firstName: null}
        </h1>
        <p className="max-w-sm mx-auto mb-10 text-sm md:max-w-xl md:text-lg">
         Δεν υπαρχει κάτι διαθέσιμο για την ώρα
      </p>  
      </div>
    </section>
    </>
    
  );
}
