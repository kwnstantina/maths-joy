import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import List from "components/lists/lists";
import {
  Category,
  Category_En,
  TAGS,
  TAGS_En,
  Type,
  Type_En,
} from "../../services/models/models";

type FilterEvent = { title: string; name: string };

type ModelEntry = {
  id: number;
  name: string;
  title: string;
  unavailable: boolean;
};

type ModelByIdShape = { byId: Record<string | number, ModelEntry> };

type FiltersShape = {
  category?: string;
  level?: string;
  type?: string;
  input?: string;
  // Back-compat prop names the loader still passes (legacy `List` callback
  // emits `title` for level and `tags` for type — the KEY_MAP in the page
  // loader normalizes them to `level` / `type` URL params).
  title?: string;
  tags?: string;
};

type Props = {
  setFiltersHandler: (evt: FilterEvent) => void;
  clearFilters: () => void;
  filters: FiltersShape;
  handleCategorySearch: () => void;
};

/**
 * Option shape fed to <List>:
 *   - `name`: the display label (English in en-mode, Greek in el-mode).
 *     This is what the Listbox renders in the button and dropdown rows.
 *   - `__greek`: the Greek-canonical value — this is what we push to the URL.
 *   - `title`: the legacy field-type key ("category" / "title" / "tags") —
 *     List passes the whole selected object to its callback; we unwrap in
 *     `onSelect` so the outbound FilterEvent carries the Greek value in
 *     `name` and the legacy field key in `title`.
 *   - `unavailable`: disables the row in the listbox (used for the empty
 *     placeholder entry at id=0).
 */
type PairedOption = {
  id: number;
  name: string;
  __greek: string;
  title: string;
  unavailable: boolean;
};

function pairOptions(
  elModel: ModelByIdShape,
  enModel: ModelByIdShape,
  isEn: boolean,
): PairedOption[] {
  const elEntries = Object.values(elModel.byId);
  const enEntries = Object.values(enModel.byId);
  return elEntries.map((elEntry, idx) => {
    const enEntry = enEntries[idx];
    const displayLabel = isEn ? enEntry?.name ?? elEntry.name : elEntry.name;
    return {
      id: elEntry.id,
      name: displayLabel,
      __greek: elEntry.name,
      title: elEntry.title,
      unavailable: elEntry.unavailable,
    };
  });
}

const SearchInput = (props: Props) => {
  const { setFiltersHandler, clearFilters, filters, handleCategorySearch } =
    props;
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en") ?? false;

  // Local text state + debounced push to the URL. Dropdown selections remain
  // synchronous (deliberate actions), but typing a search query should not
  // trigger a loader on every keystroke.
  const [textValue, setTextValue] = useState<string>(filters?.input ?? "");
  const lastPushedRef = useRef<string>(filters?.input ?? "");

  // Sync local state when the URL changes from outside (e.g., Clear button).
  useEffect(() => {
    const urlValue = filters?.input ?? "";
    if (urlValue !== lastPushedRef.current) {
      setTextValue(urlValue);
      lastPushedRef.current = urlValue;
    }
  }, [filters?.input]);

  // Debounced URL push (300ms after the user stops typing).
  useEffect(() => {
    if (textValue === lastPushedRef.current) return;
    const handle = setTimeout(() => {
      lastPushedRef.current = textValue;
      setFiltersHandler({ title: "input", name: textValue });
    }, 300);
    return () => clearTimeout(handle);
  }, [textValue, setFiltersHandler]);

  const inputStyles =
    "block w-full md:w-[60%] p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-orange-100 focus:border-orange-100 xs:w-full sm:w-full md:ml-14";
  const buttonStyles =
    "block text-white bg-orange-500 hover:bg-orange-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-4 py-2";
  const filterButtonStyles =
    "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md";

  const categoryOptions = useMemo(
    () => pairOptions(Category, Category_En, isEn),
    [isEn],
  );
  const levelOptions = useMemo(() => pairOptions(TAGS, TAGS_En, isEn), [isEn]);
  const typeOptions = useMemo(() => pairOptions(Type, Type_En, isEn), [isEn]);

  // Build Greek→display-label lookups so the List button can render the
  // CURRENT selected value in the right language (URL stores Greek; button
  // must show English when user is in en-mode).
  const labelByGreek = useMemo(() => {
    const make = (opts: PairedOption[]) => {
      const m: Record<string, string> = {};
      for (const o of opts) m[o.__greek] = o.name;
      return m;
    };
    return {
      category: make(categoryOptions),
      level: make(levelOptions),
      type: make(typeOptions),
    };
  }, [categoryOptions, levelOptions, typeOptions]);

  // Accept both the new (level / type) and legacy (title / tags) filter prop
  // names — loader passes both for back-compat.
  const selectedCategoryGreek = filters.category || "";
  const selectedLevelGreek = filters.level || filters.title || "";
  const selectedTypeGreek = filters.type || filters.tags || "";

  const selectedCategoryLabel =
    labelByGreek.category[selectedCategoryGreek] || "";
  const selectedLevelLabel = labelByGreek.level[selectedLevelGreek] || "";
  const selectedTypeLabel = labelByGreek.type[selectedTypeGreek] || "";

  /**
   * Unwrap the PairedOption from List's callback and emit a FilterEvent whose
   * `name` is the GREEK canonical value (never the English label). The
   * `title` field carries the legacy field-type key so the page loader's
   * KEY_MAP can route it to the right URL param.
   */
  const onSelect = (opt: PairedOption | null | undefined) => {
    if (!opt) return;
    setFiltersHandler({ title: opt.title, name: opt.__greek });
  };

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
          onChange={(evt) => setTextValue(evt.target.value)}
          value={textValue}
        />

        <button
          type="submit"
          onClick={handleCategorySearch}
          className={buttonStyles}
        >
          <MagnifyingGlassIcon className="w-5 inline-block " />
        </button>
      </div>

      <div className="flex justify-between items-center w-full md:w-[58rem] mt-4 md:pl-16">
        <p className="font-medium"> {t("filter")}</p>
        <button className={filterButtonStyles} onClick={clearFilters}>
          {t("clear")}
        </button>
      </div>

      <div className="flex items-center justify-start mt-8 md:pl-16  gap-4  xs:flex-col sm:flex-col md:flex-row">
        <span className=" text-left xs:w-[100%]  sm:w-[100%]  md:w-[20%]">
          <p>{t("category")}</p>
          <List
            categories={categoryOptions}
            onCallbackFunction={onSelect as () => void}
            placeholder={t("category")}
            value={selectedCategoryLabel}
          />
        </span>
        <span className="text-left  xs:w-[100%]  sm:w-[100%]  md:w-[20%] ">
          <p>{t("level")}</p>
          <List
            categories={levelOptions}
            onCallbackFunction={onSelect as () => void}
            placeholder={t("level")}
            value={selectedLevelLabel}
          />
        </span>
        <span className=" text-left xs:w-[100%]  sm:w-[100%]  md:w-[20%]">
          <p>{t("typeOfExercise")}</p>
          <List
            categories={typeOptions}
            onCallbackFunction={onSelect as () => void}
            placeholder={t("typeOfExercise")}
            value={selectedTypeLabel}
          />
        </span>
      </div>
    </>
  );
};

export default SearchInput;
