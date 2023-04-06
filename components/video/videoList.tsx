import { dateFormat } from "../../utils/utils";

type Props = {
  data: {
    url: string;
    title: string;
    description: string;
    creatorName: string;
    tags: Array<string>;
    createdAt: string;
    id: string;
  };
};

const VideoList = (props: Props): JSX.Element => {
  const { data } = props;

  return (
    <div className="w-[42rem] mt-14  mx-5 bg-gray-100 rounded-xl shadow-md overflow-hidden">
    <div className="flex flex-col" key={data.id}>
      <div className="flex  aspect-video">
        {/* <embed
              src={data.url}
            className="w-full h-full"
            /> */}
        <iframe className="w-full h-full" src={data.url} loading='lazy' allowFullScreen></iframe>
      </div>
      <div className="p-5">
        <a
          href={data.url}
          target="_blank"
          className="uppercase tracking-wide text-sm text-indigo-500 font-semibold block mt-1 text-lg leading-tight font-medium text-black hover:underline"
        >
          {data.title}
        </a>
        <p className="mt-2 text-gray-500">{data.description}</p>
        <div className="mt-4">
          {data.tags.map((tag) => {
            return (
              <span
                className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2"
                key={tag}
              >
                {tag}
              </span>
            );
          })}
        </div>
        <div className="mt-4 flex items-center">
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {data.creatorName}
            </div>
            <div className="text-sm text-gray-500">
              {dateFormat(data.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default VideoList;
