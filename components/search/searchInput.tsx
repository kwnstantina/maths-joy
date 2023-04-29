import List from "components/lists/lists";
import {TAGS,Category,Type} from '../../services/models/models';

type Props={
  setFiltersHandler:any;
  clearFilters:Function | any;
  filters:any
  handleCategorySearch:any
}
const SearchInput = (props:Props) => {
  const {setFiltersHandler,clearFilters,filters,handleCategorySearch} = props;

  return (
    <>
      <div className="flex mt-4 ml-8 gap-3 relative">
        <div  className="relative inset-y-0 top-[2px] left-[3rem] flex items-center pl-3 pointer-events-none" >
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500"
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
          className="block w-[60%] p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-orange-100 focus:border-orange-100"
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
          className="block lg:block text-white bg-orange-600 hover:bg-orange-800 focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-4 py-2"
        >
          Αναζήτηση
        </button>
        </div>

      <div  className=" flex justify-between items-center w-[58rem]  items-center   md:mt-4 md:pl-16">
        <p className="font-medium pl-4"> Φίλτρα</p>
        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md" onClick={clearFilters}>
          Καθαρισμός φίλτρων
        </button>
      </div>

      <div>
        <div className="flex items-center justify-start mt-4  pl-10 gap-4 ">
          <span className="w-56"> 
            <strong>Κατηγορία</strong>
          <List
            categories={Object.values(Category.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder='Κατηγορία...'
            value={filters.category}
          />
          </span>
        <span className="w-56"> 
            <strong>Τάξη</strong>
          <List
            categories={Object.values(TAGS.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder='Τάξη...'
            value={filters.title}
          />
          </span>
          <span className="w-56"> 
            <strong>Είδος ασκήσεων</strong>
          <List
            categories={Object.values(Type.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder='Είδος άσκησης...'
            value={filters.tags}
          />
          </span>
          
        </div>
      </div>
    </>
  );
};

export default SearchInput;
