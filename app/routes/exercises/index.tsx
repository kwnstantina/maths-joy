import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";
import { useLoaderData ,useSearchParams} from "@remix-run/react";
import {
  LoaderFunction,
} from "@remix-run/node";
import {useState,useCallback} from 'react';
import {getAllExcersices,getExersiceBySearch} from '../../utils/exersices.prisma';

export const loader: LoaderFunction = async ({request}) => {
  let exersisesAll=await getAllExcersices();
  const url = new URL(request.url);
  const filters={
    category:url.searchParams.get("category"),
    tags:url.searchParams.get("tags"),
    searchItem:url.searchParams.get("searchItem"),
    title:  url.searchParams.get("title")
  }
  let textFilter={}
  if(Object.values(filters).filter(Boolean).length>0){
    textFilter = {
      OR:[
        {
          title: {
                mode: 'insensitive',
                equals: filters?.title 
            }
        },
        {
          title: {
              mode: 'insensitive',
              contains: filters?.searchItem 
          }
       },
      ],
      AND: [  
         {
          tags: {
              mode: 'insensitive',
              equals: filters?.tags 
          }
       },
       {
        category: {
            mode: 'insensitive',
            equals: filters?.category 
        }
     },
      
      ]
  }
 return  await getExersiceBySearch(textFilter);
} 
  
  return exersisesAll ?? []
};

const Exersices = () => {
  const data = useLoaderData<typeof loader>()
  const [filters,setFilters] = useState({
    category:'',
    title:'',
    input:'',
    tags:''
  });
  const [searchParams, setSearchParams] = useSearchParams();
  
  const clearFilters = () => {
    setSearchParams({});
    setFilters(
      {
        category:'',
        title:'',
        input:'',
        tags:''
    })
  }
  const handleCategorySearch=useCallback((selected:any)=>{
    setSearchParams( {category:filters.category,tags:filters.tags,searchItem:filters.input,title:filters.title});
  },[filters])

   const setFiltersHandler =useCallback((evt:{title:string,name:string} |any ) => {
    return setFilters((filter) => ({
      ...filter,
      [evt?.title]: evt?.name,
    }));
  },[filters]);


  return (
    <div className="container px-6 text-center pb-52" >
      <SearchInput 
      handleCategorySearch={handleCategorySearch}
      setFiltersHandler={setFiltersHandler} 
      clearFilters={clearFilters} 
      filters={filters}/>
      <div className="container flex flex-wrap gap-3 mb-5 mt-10 bg-orange-100	bg-opacity-30 rounded-lg shadow-lg ">
      {data?.map((item:any)=>{return <Card key={item.id} item={item}/>})}  
      </div>
    </div>
  );
};

export default Exersices;
