import HorizontalLine from "components/horizontalLine/horizontalLine";

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
  const exerciseLabel = `Άσκηση ${index + 1}`;
  return (
    <div key={id} className="mx-5 my-10">
        <h2 className="text-gray-700 text-base underline">{exerciseLabel} </h2>
      <div>
        <img src={contentImage} alt={`${exerciseLabel} - εκφώνηση`} />
      </div>
      <div>
        <HorizontalLine/>
      </div>
      <div>
        <button
         onClick={()=>handleViewedExersices(id)}
         aria-expanded={isExersiceViewed.includes(id)}
         className="w-30 h-30 text-center rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 m-5"
         >
          Λύση
        </button>
      </div>
      <div>
        {isExersiceViewed.includes(id)?
        <>
         <img src={solutionImage} alt={`${exerciseLabel} - λύση`} />
         <HorizontalLine/>
         </>
         : null}
      </div>
    </div>
  );
};

export default TrainingList;
