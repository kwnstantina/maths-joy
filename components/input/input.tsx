type Props={
  onChangeCallback:Function | any;
  isSideBarClose:boolean;
}

const Input = (props:Props) => {
  const {onChangeCallback,isSideBarClose}=props;

  return (
    <form className="flex items-center">
      <label htmlFor="simple-search" className="hidden">
        Αναζήτηση
      </label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <input
          type="text"
          id="simple-search"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          placeholder="Αναζήτηση"
          onChange={onChangeCallback}
        >
        </input>
        {!isSideBarClose && <div className="flex absolute bottom-3 right-3 text-sm">
          <div className=" items-center flex h-5 relative w-6 rounded shadow-md bg-gray-100 ring-4  justify-center ring-gray-200 mr-3">
          Ctr
          </div>
          <div  className=" items-center flex h-5 relative w-6 rounded shadow-md bg-gray-100 ring-4 justify-center ring-gray-200">
            K
          </div>
        </div>
        }
      </div>
    </form>
  );
};

export default Input;
