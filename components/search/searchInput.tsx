import List from "components/lists/lists";
import {TAGS,Category,Type} from '../../services/models/models';

type Props={
  setFiltersHandler:Function;
  clearFilters:Function | any;
  filters:any
  handleCategorySearch:any
}
const SearchInput = (props:Props) => {
  const {setFiltersHandler,clearFilters,filters,handleCategorySearch} = props;

  return (
    <>
      <div className="relative w-2/5 mt-5 ml-16">
        <div  className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" >
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
          name="input"
          onChange={(evt)=>{
            let input={
              title:evt.target.name,
              name:evt.target.value
            }
            setFiltersHandler(input)
          }}
          value={filters?.input || ''}
        />
        <button
          type="submit"
          onClick={handleCategorySearch}
          className="block md:hidden lg:block text-white absolute right-2.5 bottom-2.5 bg-orange-600 hover:bg-orange-800 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Αναζήτηση
        </button>
      </div>

      <div  className="px-2 flex justify-start items-center w-full  items-center md:gap-[23rem]  md:mt-4 md:pl-16">
        <p className="font-medium"> Φίλτρα</p>

        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md" onClick={clearFilters}>
          Καθαρισμός φίλτρων
        </button>
      </div>

      <div>
        <div className="flex items-center justify-start mt-4 pl-16 gap-4">
          <span> 
            <strong>Κατηγορία</strong>
          <List
            categories={Category}
            onCallbackFunction={setFiltersHandler}
          />
          </span>
          <span>
            <strong>Τάξη</strong>
          <List
            categories={TAGS}
            onCallbackFunction={setFiltersHandler}
          />
          </span>
          <span>
            <strong>Είδος ασκήσεων</strong>
          <List
            categories={Type}
            onCallbackFunction={setFiltersHandler}
          />
          </span>
          
        </div>
      </div>
    </>
  );
};

export default SearchInput;
