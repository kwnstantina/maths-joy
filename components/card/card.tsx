import { EyeIcon } from "@heroicons/react/outline";
import {dateFormat} from '../../utils/utils';
import { useNavigate } from '@remix-run/react'

const Card = (props:any) => {
  const {item}=props;
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-center m-10">
      <div className="block rounded-lg shadow-lg bg-white max-w-sm text-center">
      <img  src={item?.photo?.regular} alt="Γρηγόρης Κυρτσιάς" className="rounded-t-lg"/>  
        <div className="p-6">
          <h5 className="text-gray-900 text-xl font-medium mb-2">
           Κατηγορία: {item.category}
          </h5>
          <p className="text-gray-700 text-base mb-4">
            Τύπος άσκησης: <strong>{item.tags}</strong>
          </p>
          <p className="text-gray-700 text-base mb-4">
            Τάξη: <strong>{item.title}</strong>
          </p>
          <button
            type="button"
            onClick={() => navigate(`${item.id}`)}
            className="inline-block px-6 py-2.5 bg-orange-400 text-white 
            focus:shadow-outline  font-medium 
            text-xs leading-tight uppercase rounded shadow-2xl hover:bg-orange-700 hover:shadow-2xg focus:bg-orange-700 focus:ring-0 active:bg-orange-800"
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
