import { Outlet, Link, useLoaderData } from "@remix-run/react";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";
import Input from "components/input/input";
import { ExerciseNavList } from "../../services/models/models";
import { useState, useCallback } from "react";
import "react-cmdk/dist/cmdk.css";
import Modal from "components/modal/modal";
import Kbar from "components/kbar/kbar";
import { LoaderFunction, json } from "@remix-run/node";
import { getTrainingExercises } from "~/utils/training.prisma";

export const loader: LoaderFunction = async ({ request }) => {
  let exercises = await getTrainingExercises();
  return json(exercises);
};

const TestYourself = () => {
  const data: any = useLoaderData();
  const [searchValue, setSearchValue] = useState("initial");

  const searchHandler = useCallback((evt: any) => {
    if (!evt.target.value) {
      setSearchValue("initial");
    } else {
      setSearchValue(evt.target.value);
    }
  }, []);

  return (
    <>
      <Kbar />
      <div className="flex">
        <div className="flex flex-col h-screen p-3 bg-white shadow-2xl ring-2 ring-gray-200 w-60">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="mt-1">
                <Input onChangeCallback={searchHandler} />
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
                  {Object.entries(data?.groupedExersices)?.map(
                    ([title, grouped]: any) => {
                      return (
                        <Disclosure key={title}>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full justify-between rounded-lg  px-4 py-2 text-left text-sm font-medium text-orange-900 hover:bg-orange-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-75">
                                <span>{title}</span>
                                <ChevronUpIcon
                                  className={`${
                                    open ? "rotate-180 transform" : ""
                                  } h-5 w-5 text-orange-500`}
                                />
                              </Disclosure.Button>
                              {grouped?.map((sub: any) => {
                                return (
                                  <Disclosure.Panel
                                    className="px-8 p-2 text-sm text-black-500"
                                    key={sub.id}
                                  >
                                    <button
                                      className="text-black text-left background-transparent font-bold uppercase  text-m outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                      type="button"
                                    >
                                      {sub.searchableTitle}
                                    </button>
                                  </Disclosure.Panel>
                                );
                              })}
                            </>
                          )}
                        </Disclosure>
                      );
                    }
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
          <Outlet context={"hello"} />
        </main>
      </div>
    </>
  );
};

export default TestYourself;
