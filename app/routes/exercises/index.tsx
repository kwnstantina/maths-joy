import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { LoaderFunction, json } from "@remix-run/node";
import { useState, useCallback } from "react";
import {
  getAllExcersices,
  getExersiceBySearch,
} from "../../utils/exersices.prisma";
import { TAGS, Category, Type } from "../../../services/models/models";
import { useTranslation } from "react-i18next";

export const loader: LoaderFunction = async ({ request }) => {
  let exersisesAll = await getAllExcersices();
  const url = new URL(request.url);
  const filters = {
    category: url.searchParams.get("category"),
    tags: url.searchParams.get("tags"),
    input: url.searchParams.get("input"),
    title: url.searchParams.get("title"),
    lang: url.searchParams.get("lang"),
  };

  const whereClause: any = {};

  // Apply filters based on the 'filters' object.
  if (filters.lang === "el") {
    if (filters.category) {
      whereClause.category = filters.category;
    }
    if (filters.title) {
      whereClause.title = filters.title;
    }
    if (filters.input) {
      whereClause.description = {
        contains: filters.input,
      };
    }
    if (filters.tags) {
      whereClause.tags = {
        contains: filters.tags,
      };
    }
    exersisesAll = await getExersiceBySearch(whereClause);
  } else if (filters.lang === "en") {
    
    whereClause.translation = {
      not: {
        equals: null,
      },
    };
  
    //after the search we need to parse the translation and queries the db again
    //to get the english translation
    

   exersisesAll = await getExersiceBySearch(whereClause);
    exersisesAll = exersisesAll.map((exercise: any) => {
      if (exercise.translation) {
        try {
          const translation = JSON.parse(exercise.translation); // Assuming translation is a string, otherwise skip this line
          if (translation.en) {
            return {
              ...exercise,
              title: translation.en.title,
              description: translation.en.description,
              category: translation.en.category,
              tags: translation.en.tags,
            };
          }
        } catch (err) {
          console.error("Error parsing JSON:", err);
        }
      }
      return exercise; // If no English translation, return original
    });  
  }

  // if (Object.values(filters).filter(Boolean).length > 0) {
  //   const where = {
  //     ...(filters.searchItem
  //       ? {
  //           OR: [
  //             {
  //               description: {
  //                 contains: filters.searchItem,
  //                 mode: "insensitive",
  //               },
  //             },
  //           ],
  //         }
  //       : {}),
  //     ...(filters.tags || filters.category
  //       ? {
  //           AND: [
  //             {
  //               tags: {
  //                 contains: filters.tags || "",
  //                 mode: "insensitive",
  //               },
  //             },
  //             {
  //               category: {
  //                 contains: filters.category || "",
  //                 mode: "insensitive",
  //               },
  //             },
  //           ],
  //         }
  //       : {}),
  //   };
  //   exersisesAll = await getExersiceBySearch(where);
  // }

  return json(exersisesAll) ?? [];
};

const Exersices = () => {
  const data = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();
  const [_, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<any>({
    category: Object.values(Category.byId)[0].name,
    title: Object.values(Type.byId)[0].name,
    input: "",
    tags: Object.values(TAGS.byId)[0].name,
    lang: i18n.language,
  });
  console.log('i18n.language', i18n.language)

  const clearFilters = () => {
    setSearchParams({});
    setFilters({
      category: Object.values(Category.byId)[0].name,
      title: Object.values(Type.byId)[0].name,
      input: "",
      tags: Object.values(TAGS.byId)[0].name, 
      lang: i18n.language,
    });
  };
  const handleCategorySearch = useCallback(() => {
    const entries = Object.entries(filters)
      .filter(([_, value]) => value)
      .filter((item) => item !== undefined);
    const filteredSearchParams = Object.fromEntries(entries) as any;
    setSearchParams(filteredSearchParams);
  }, [filters]);

  const setFiltersHandler = useCallback(
    (evt: { title: string; name: string } | any) => {
      return setFilters((filter: any) => ({
        ...filter,
        [evt?.title]: evt?.name,
        ["lang"]: i18n.language,
      }));
    },
    [filters,i18n.language]
  );

  console.log("data", data);

  return (
    <div className="container px-6 text-center pb-52 my-20">
      <SearchInput
        handleCategorySearch={handleCategorySearch}
        setFiltersHandler={setFiltersHandler}
        clearFilters={clearFilters}
        filters={filters}
      />
      <div className="container flex flex-wrap gap-3 mb-5 mt-10 bg-orange-100	bg-opacity-30 rounded-lg shadow-lg">
        {data?.map((item: any) => {
          return <Card key={item.id} item={item} />;
        })}
      </div>
    </div>
  );
};

export default Exersices;
