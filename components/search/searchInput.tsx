import List from "components/lists/lists";
import { TAGS, Category, Type, Category_En, Type_En, TAGS_En } from "../../services/models/models";
import { useTranslation } from "react-i18next";
import { SearchIcon} from "@heroicons/react/outline";

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
  const inputStyles = "block w-full md:w-[60%] p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-orange-100 focus:border-orange-100 xs:w-full sm:w-full md:ml-14";
  const buttonStyles = "block text-white bg-orange-500 hover:bg-orange-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-4 py-2";
  const filterButtonStyles = "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md";

  return (
    <>
      <div className="flex mt-4 gap-3 relative z-0">
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
          {/* {t("search")} */}
          <SearchIcon className="w-5 inline-block " />
        </button>
      </div>

      <div className="flex justify-between items-center w-full md:w-[58rem] mt-4 md:pl-16">
        <p className="font-medium"> {t("filter")}</p>
        <button
          className={filterButtonStyles}
          onClick={clearFilters}
        >
          {t("clear")}
        </button>
      </div>

      <div className="flex items-center justify-start mt-8 md:pl-16  gap-4  xs:flex-col sm:flex-col md:flex-row">
        <span className=" text-left xs:w-[100%]  sm:w-[100%]  md:w-[20%]">
          <p>{t("category")}</p>
          <List
            categories={i18n.language === "en" ? Object.values(Category_En.byId) : Object.values(Category.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder={t("category")}
            value={filters.category}
          />
        </span>
        <span className="text-left  xs:w-[100%]  sm:w-[100%]  md:w-[20%] ">
          <p>{t("level")}</p>
          <List
            categories={i18n.language === "en" ? Object.values(TAGS_En.byId) : Object.values(TAGS.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder={t("level")}
            value={filters.title}
          />
        </span>
        <span className=" text-left xs:w-[100%]  sm:w-[100%]  md:w-[20%]">
          <p>{t("typeOfExercise")}</p>
          <List
            categories={i18n.language === "en" ? Object.values(Type_En.byId) : Object.values(Type.byId)}
            onCallbackFunction={setFiltersHandler}
            placeholder={t("typeOfExercise")}
            value={filters.tags}
          />
        </span>
      </div>
    </>
  );
};

export default SearchInput;
