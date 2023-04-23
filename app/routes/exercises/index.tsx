import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";
import { useLoaderData ,useSearchParams} from "@remix-run/react";
import {
  LoaderFunction,
} from "@remix-run/node";
import {useState,useCallback} from 'react';
import {getAllExcersices,getExersiceBySearch} from '../../utils/exersices.prisma';
import {TAGS,Category,Type} from '../../../services/models/models';
import { createApi } from 'unsplash-js';
import {staticImages} from '../../../services/models/models';


export const loader: LoaderFunction = async ({request}) => {
  const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_TOKEN as string,  fetch: fetch,});
  let exersisesAll=await getAllExcersices();
  const url = new URL(request.url);
  const filters={
    category:url.searchParams.get("category"),
    tags:url.searchParams.get("tags"),
    searchItem:url.searchParams.get("input"),
    title:  url.searchParams.get("title")
  }
  let textFilter={}
  let photos:any=[]
  let photosError=null as null | string;

  await unsplash.search.getCollections({
    query: 'maths',
    page: 1,
    perPage: 10,
  }).then(result => {
    if (result.errors) {
      photosError=result.errors[0];
    } else {
      photos=[...result.response.results]
    }
  });

  if(Object.values(filters).filter(Boolean).length>0){
    textFilter = {
      OR:[
        {
          title: {
                mode: 'insensitive',
                contains: filters.title ?? ''
            }
        },
        {
          title: {
              mode: 'insensitive',
              contains: filters.searchItem ?? ''
          }
       },
      ],
      AND: [  
         {  
          tags: {
              mode: 'insensitive',
              contains: filters.tags ?? ''
          }
       },
       {
        category: {
            mode: 'insensitive',
            contains: filters.category  ?? ''
        }
     },
      
      ]
  }
  exersisesAll= await getExersiceBySearch(textFilter);
} 

 return exersisesAll.map(exercise => ({
    ...exercise,
    photo: photos.length>0 && !photosError? photos[Math.floor(Math.random()* photos.length)].cover_photo.urls: staticImages[Math.floor(Math.random()* staticImages.length)].cover_photo.urls,
  })) ?? []
};

const Exersices = () => {
  const data = useLoaderData<typeof loader>()
  const [filters,setFilters] = useState<any>({
    category:Object.values(Category.byId)[0].name,
    title:Object.values(Type.byId)[0].name,
    input:'',
    tags:Object.values(TAGS.byId)[0].name 
  });
  const [searchParams, setSearchParams] = useSearchParams();
  
  const clearFilters = () => {
    setSearchParams({});
    setFilters(
      {
        category:Object.values(Category.byId)[0].name,
        title:Object.values(Type.byId)[0].name,
        input:'',
        tags:Object.values(TAGS.byId)[0].name 
    })

  }
  const handleCategorySearch=useCallback(()=>{
    const entries = Object.entries(filters).filter(([_, value]) => value).filter(item=>item!==undefined) ;
    const filteredSearchParams=Object.fromEntries(entries) as any;
    setSearchParams(filteredSearchParams);
  },[filters])

   const setFiltersHandler =useCallback((evt:{title:string,name:string} |any ) => {
     return setFilters((filter:any) => ({
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
