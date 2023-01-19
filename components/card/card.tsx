import { EyeIcon } from "@heroicons/react/outline";
import {dateFormat} from '../../utils/utils';
const Card = (props:any) => {
  const {item}=props;
  
  return (
    <div className="flex justify-center m-10">
      <div className="block rounded-lg shadow-lg bg-white max-w-sm text-center">
        <div className="py-3 px-6 border-b border-orange-300">{item.title}</div>
        <div className="p-6">
          <h5 className="text-gray-900 text-xl font-medium mb-2">
            Ασκήσεις με λύσεις για τους μαθητές της
          </h5>
          <p className="text-gray-700 text-base mb-4">
            {item.tags}
          </p>
          <button
            type="button"
            className=" inline-block px-6 py-2.5 bg-orange-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            <EyeIcon className="w-5 h-5"/>
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
