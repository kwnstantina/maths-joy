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

export const loader: LoaderFunction = async ({ request }) => {

  let exersisesAll = await getAllExcersices();
  const url = new URL(request.url);
  const filters = {
    category: url.searchParams.get("category"),
    tags: url.searchParams.get("tags"),
    searchItem: url.searchParams.get("input"),
    title: url.searchParams.get("title"),
  };

  let photos: any = [];
  let photosError = null as null | string;

  if (Object.values(filters).filter(Boolean).length > 0) {
    const where = {
      ...(filters.searchItem
        ? {
            OR: [
              {
                title: {
                  contains: filters.searchItem,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(filters.tags || filters.category
        ? {
            AND: [
              {
                tags: {
                  contains: filters.tags || "",
                  mode: "insensitive",
                },
              },
              {
                category: {
                  contains: filters.category || "",
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };
    exersisesAll = await getExersiceBySearch(where);
  }

  return json(exersisesAll) ?? []
};

const Exersices = () => {
  const data = useLoaderData<typeof loader>();
  const [filters, setFilters] = useState<any>({
    category: Object.values(Category.byId)[0].name,
    title: Object.values(Type.byId)[0].name,
    input: "",
    tags: Object.values(TAGS.byId)[0].name,
  });
  const [_, setSearchParams] = useSearchParams();

  const clearFilters = () => {
    setSearchParams({});
    setFilters({
      category: Object.values(Category.byId)[0].name,
      title: Object.values(Type.byId)[0].name,
      input: "",
      tags: Object.values(TAGS.byId)[0].name,
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
      }));
    },
    [filters]
  );

  return (
    <div className="container px-6 text-center pb-52">
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
