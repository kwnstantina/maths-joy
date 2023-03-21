import React from "react";

type Props = {
  contentImage: string;
  solutionImage: string;
  id:string;
  handleViewedExersices: (id:string)=>void;
  isExersiceViewed:Array<string>
  index:number
};
const TrainingList = (props: Props) => {
  const { contentImage, solutionImage,id,isExersiceViewed ,handleViewedExersices,index} = props;
  return (
    <div key={id} className="mx-5 my-10">
        <h1 className="text-gray-700 text-base underline">Άσκηση {index+1} </h1>
      <div>
        <img src={contentImage} />
      </div>
      <div>
        <button
        onClick={()=>handleViewedExersices(id)}
         className="w-30 h-30 text-center rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400"
         >
          Λύση
        </button>
      </div>
      <div>
        {isExersiceViewed.includes(id)?  <img src={solutionImage} />: null}
      </div>
  
    </div>
  );
};

export default TrainingList;
