import { EyeIcon } from "@heroicons/react/24/outline";
import { dateFormat } from "../../utils/utils";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
const Card = (props: any) => {
  const { item } = props;
  const { t } = useTranslation();
  const viewLabel = t("card.view", "View");

  return (
    <div className="flex justify-center md:m-10 ">
      <article className="block rounded-lg shadow-2xl bg-white md:max-w-md	xs:max-w-full sm:max-w-full	 xs:mb-7 sm:mb-7 text-center ring-2 ring-neutral-100 ring-offset-0">
        <Link
          to={`${item.id}`}
          aria-label={`${viewLabel}: ${item.title || item.category}`}
          className="block aspect-w-3 aspect-h-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-t-lg"
        >
          <img
            src={item?.exerciseImgUrl}
            alt={item?.title || item?.category || "Exercise"}
            className="rounded-t-lg"
          />
        </Link>
        <div className="p-6">
          <h3 className="text-gray-900 text-xl font-medium mb-2">
            {item.category}
          </h3>
          <p className="text-gray-700 text-base mb-4">
            {item?.description}
          </p>
          <div className="px-6 pt-4 pb-2">
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              {item.tags}
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              {item.title}
            </span>
          </div>
          <Link
            to={`${item.id}`}
            aria-label={`${viewLabel}: ${item.title || item.category}`}
            className="inline-block px-6 py-2.5 bg-orange-400 text-white
            font-medium
            text-xs leading-tight uppercase rounded shadow-2xl hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 active:bg-orange-800"
          >
            <EyeIcon className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="py-3 px-6 border-t border-orange-300 text-gray-600">
          {dateFormat(item.createdAt)}
        </div>
      </article>
    </div>
  );
};

export default Card;
