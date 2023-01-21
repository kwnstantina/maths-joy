import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";
import { useLoaderData } from "@remix-run/react";
import {
  LoaderFunction,
} from "@remix-run/node";

import {getAllExcersices} from '../../utils/exersices.prisma';
export const loader: LoaderFunction = async ({ request }) => {
  return await getAllExcersices()
};

const Exersices = () => {
  const data = useLoaderData<typeof loader>()
 
  return (
    <div className="container mx-auto px-6 text-center pb-52" >
      <SearchInput />
      <div className="container flex flex-wrap gap-3 mb-5 mt-10 bg-orange-100	bg-opacity-30 rounded-lg shadow-lg ">
      {data?.map((item:any)=>{return <Card key={item.id} item={item}/>})}  
      </div>
    </div>
  );
};

export default Exersices;
