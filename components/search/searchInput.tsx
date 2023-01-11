import List from "components/lists/lists";
import { TAGS } from "services/models/models";

{
  /* <form className="ml-10">
     <h1 className='text-xl'>Φίλτρα</h1>
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Παράγωγοι, ολοκληρώματα..."
          required
        />
        <button
          type="submit"
          className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Αναζήτηση
        </button>
      </div>
      <List categories={CATEGORIES} onCallbackFunction={(selected: any)=>console.log('ee',selected)}/>
    </form> */
}

const CATEGORIES = [
  { name: "Κατηγορίες" },
  { name: "Ολοκληρώματα" },
  { name: "Παράγωγοι" },
  { name: "Μιγαδικά" },
  { name: "Γεωμετρία" },
  { name: "Τριγωνομετρία" },
];
const SearchInput = () => {
  return (
    <>
      <div className="relative w-2/5 mt-5 ml-16">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Παράγωγοι, ολοκληρώματα..."
          required
        />
        <button
          type="submit"
          className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Αναζήτηση
        </button>
      </div>

      <div className="flex items-center justify-start mt-4 pl-16 gap-96">
        <p className="font-medium"> Φίλτρα</p>

        <button className="ml-9 px pr-11 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md">
          Reset Filter
        </button>
      </div>

      <div>
        <div className="flex items-center justify-start mt-4 pl-16 gap-4">
          <List
            categories={CATEGORIES}
            onCallbackFunction={(selected: any) => console.log("ee", selected)}
          />
          <List
            categories={TAGS}
            onCallbackFunction={(selected: any) => console.log("ee", selected)}
          />
        </div>
      </div>
    </>
  );
};

export default SearchInput;
