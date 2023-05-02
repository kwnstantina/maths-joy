import { EyeIcon } from "@heroicons/react/outline";
import { dateFormat } from "../../utils/utils";
import { useNavigate } from "@remix-run/react";
const Card = (props: any) => {
  const { item } = props;
  const navigate = useNavigate();

  return (
    <div className="flex justify-center m-10">
      <div className="block rounded-lg shadow-lg bg-white max-w-sm text-center cursor-pointer">
        <div className="aspect-w-3 aspect-h-4" typeof="button"   onClick={() => navigate(`${item.id}`)}>
          <img
            //src={item?.photo?.regular}
            src={item?.exerciseImgUrl}
            alt="Γρηγόρης Κυρτσιάς"
            className="rounded-t-lg"
          />
        </div>
        <div className="p-6">
          <h5 className="text-gray-900 text-xl font-medium mb-2">
            {item.category}
          </h5>
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
          <button
            type="button"
            onClick={() => navigate(`${item.id}`)}
            className="inline-block px-6 py-2.5 bg-orange-400 text-white 
            focus:shadow-outline  font-medium 
            text-xs leading-tight uppercase rounded shadow-2xl hover:bg-orange-700 hover:shadow-2xg focus:bg-orange-700 focus:ring-0 active:bg-orange-800"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="py-3 px-6 border-t border-orange-300 text-gray-600">
          {dateFormat(item.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default Card;
