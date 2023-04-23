import { json, LoaderFunction } from "@remix-run/node";
import { getTrainingExercises } from "~/utils/training.prisma";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import TrainingList from "components/training/trainingList";

export const loader: LoaderFunction = async ({ request }) => {
  let exercises = await getTrainingExercises();
  return json(exercises);
};
  
const TestYourself = () => {
  const data: any = useLoaderData();
  const [isExersiceViewed, setIsExerciseViewed] = useState([""]);
  
  const handleViewedExersices = (id: string) => {
    if (isExersiceViewed.includes(id)) {
      setIsExerciseViewed((prev) => prev.filter((item) => item != id));
    } else {
      setIsExerciseViewed([...isExersiceViewed, id]);
    }
  };

  return (
    <div className="w-full mx-auto h-full">
      <div className="px-4 py-6 sm:px-0  h-full">
        <div className="border-4 border-dashed border-gray-200 rounded-lg  flex-col gap-4 h-full">
          {data.exersicesList?.map((item: any, index: number) => {
            return (
              <TrainingList
                key={item.id}
                {...item}
                index={index}
                handleViewedExersices={handleViewedExersices}
                isExersiceViewed={isExersiceViewed}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestYourself;
