import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronUpIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/solid";
import Input from "components/input/input";
import { useCallback, useMemo, useState } from "react";
import { LoaderFunction, data } from "@remix-run/node";
import { getTrainingExercises } from "~/utils/training.prisma";

export const loader: LoaderFunction = async ({ request }) => {
  const exercises = await getTrainingExercises();
  return data(exercises);
};

const TestYourself = () => {
  const data: any = useLoaderData();
  const [_, setSearchParams] = useSearchParams();
  const [isSideBarClose, setIsSideBarClose] = useState(false);
  const [query, setQuery] = useState("");

  const handleToggle = () => {
    setIsSideBarClose(!isSideBarClose);
  };

  const setFilterHander = useCallback(
    (url: any) => setSearchParams({ searchableTitle: url }),
    [setSearchParams]
  );

  const groupedExersices: Record<string, any[]> = useMemo(
    () => data?.groupedExersices || {},
    [data?.groupedExersices]
  );

  const flatResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const items of Object.values(groupedExersices)) {
      for (const item of items || []) {
        const title = item?.searchableTitle ?? "";
        if (title.toLowerCase().includes(q) && !seen.has(title)) {
          seen.add(title);
          out.push(item);
        }
      }
    }
    return out;
  }, [groupedExersices, query]);

  const showResults = query.trim().length > 0;

  return (
    <div>
      <button
        className={`relative top-[20rem] bg-orange-700 rounded-full ${isSideBarClose ? "left-[5em]" : "left-[14em]"} pl-2 h-7 w-10  text-white hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 transition-all ease-in-out duration-300`}
        onClick={handleToggle}
        aria-label={isSideBarClose ? "Open sidebar" : "Close sidebar"}
        aria-expanded={!isSideBarClose}
      >
        {isSideBarClose ? (
          <ChevronDoubleLeftIcon className="h-6 w-6 " />
        ) : (
          <ChevronDoubleRightIcon className="h-6 w-6" />
        )}
      </button>
      <div className="flex">
        <div className={`flex flex-col h-[100vh] p-3 bg-white shadow-2xl ring-1 ring-gray-10 ${isSideBarClose ? "w-24" : "w-60"} transition-all ease-in-out duration-300`}>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="mt-1">
                <Input value={query} onChange={setQuery} />
              </div>
            </div>
            <div className="flex-1">
              <Transition
                show={true}
                enter="transition-opacity duration-150"
                enterFrom="opacity-20"
                enterTo="opacity-100"
                leave="transition-opacity duration-350"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="my-5">
                  {showResults ? (
                    <div className="flex flex-col">
                      {flatResults.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Δεν βρέθηκαν αποτελέσματα
                        </div>
                      ) : (
                        flatResults.map((sub: any) => (
                          <button
                            key={sub.id}
                            className="px-4 py-2 text-orange-900 text-left background-transparent font-bold uppercase text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:bg-orange-100 rounded-lg"
                            onClick={() => setFilterHander(sub.searchableTitle)}
                          >
                            {sub.searchableTitle}
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    Object.entries(groupedExersices).map(([title, grouped]: any) => (
                      <Disclosure key={title}>
                        {({ open }) => (
                          <>
                            <Disclosure.Button className="flex w-full justify-between rounded-lg  px-4 py-2 text-left text-sm font-medium text-orange-900 hover:bg-orange-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-75">
                              <span>{title}</span>
                              <ChevronUpIcon
                                className={`${open ? "rotate-180 transform" : ""} h-5 w-5 text-orange-500`}
                              />
                            </Disclosure.Button>
                            {grouped?.map((sub: any) => (
                              <Disclosure.Panel
                                className="px-8 p-2 text-sm text-black-500 overflow-hidden"
                                key={sub.id}
                              >
                                <button
                                  className=" text-orange-900 text-left background-transparent font-bold uppercase  text-m focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 mr-1 mb-1 ease-linear transition-all duration-150"
                                  onClick={() => setFilterHander(sub.searchableTitle)}
                                >
                                  {sub.searchableTitle}
                                </button>
                              </Disclosure.Panel>
                            ))}
                          </>
                        )}
                      </Disclosure>
                    ))
                  )}
                </div>
              </Transition>
            </div>
          </div>
        </div>
        <main
          id="content"
          className="flex-1 p-6 lg:px-8 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] h-full"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TestYourself;
