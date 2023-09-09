import List from "components/lists/lists";
import { TAGS, Category, Type, Category_En, Type_En, TAGS_En } from "../../services/models/models";
import { useTranslation } from "react-i18next";

type Props = {
  setFiltersHandler: any;
  clearFilters: Function | any;
  filters: any;
  handleCategorySearch: any;
};

const SearchInput = (props: Props) => {
  const { setFiltersHandler, clearFilters, filters, handleCategorySearch } = props;
  const { t, i18n } = useTranslation();

  // Define inline styles using Tailwind CSS classes
  const inputStyles = "block w-[60%] p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-orange-100 focus:border-orange-100";
  const buttonStyles = "block lg:block text-white bg-orange-500 hover:bg-orange-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-4 py-2";
  const filterButtonStyles = "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md";

  return (
    <>
      <div className="flex mt-4 gap-3 relative z-0">
        {/* This is for small screens */}
        <div className="relative inset-y-0 top-[2px] left-[3rem] flex items-center md:pl-3 pointer-events-none xs:hidden sm:hidden">
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
          className={inputStyles}
          placeholder={t("searchPlaceholder")}
          required
          name="input"
          onChange={(evt) => {
            let input = {
              title: evt.target.name,
              name: evt.target.value,
            };
            setFiltersHandler(input);
          }}
          value={filters?.input || ""}
        />

        <button
          type="submit"
          onClick={handleCategorySearch}
          className={buttonStyles}
        >
          {t("search")}
        </button>
      </div>

      {/* This is for medium and larger screens */}
      <div className="flex justify-between items-center xs:w-16 sm:w-16 md:w-[58rem] md:mt-4 xs:pl-10 md:pl-16">
        <p className="font-medium"> {t("filter")}</p>
        <button
          className={filterButtonStyles}
          onClick={clearFilters}
        >
          {t("clear")}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-start mt-8 pl-10 gap-4 ">
          <span className="w-56 text-left ">
            <p>{t("category")}</p>
            <List
              categories={i18n.language === "en" ? Object.values(Category_En.byId) : Object.values(Category.byId)}
              onCallbackFunction={setFiltersHandler}
              placeholder={t("category")}
              value={filters.category}
            />
          </span>
          <span className="w-56 text-left">
            <p>{t("level")}</p>
            <List
              categories={i18n.language === "en" ? Object.values(TAGS_En.byId) : Object.values(TAGS.byId)}
              onCallbackFunction={setFiltersHandler}
              placeholder={t("level")}
              value={filters.title}
            />
          </span>
          <span className="w-56 text-left">
            <p>{t("typeOfExercise")}</p>
            <List
              categories={i18n.language === "en" ? Object.values(Type_En.byId) : Object.values(Type.byId)}
              onCallbackFunction={setFiltersHandler}
              placeholder={t("typeOfExercise")}
              value={filters.tags}
            />
          </span>
        </div>
      </div>
    </>
  );
};

export default SearchInput;
