import { useState } from "react";
import {
  dateFormat,
  getVideoProvider,
  getVideoThumbnail,
  getYouTubeEmbedUrl,
} from "../../utils/utils";

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
  const [playing, setPlaying] = useState(false);
  const provider = getVideoProvider(data.url);
  const thumbnail = getVideoThumbnail(data.url);

  return (
    <div className="md:w-[42rem] mt-14  mx-5 bg-gray-100 rounded-xl shadow-md overflow-hidden xs:w-[20rem] sm:w-[20rem]">
    <div className="flex flex-col" key={data.id}>
      <div className="flex  aspect-video">
        {provider === "cloudinary" ? (
          <video
            className="w-full h-full object-cover"
            src={data.url}
            poster={thumbnail ?? undefined}
            controls
            preload="none"
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : playing || !thumbnail ? (
          <iframe
            className="w-full h-full"
            src={playing ? getYouTubeEmbedUrl(data.url) : data.url}
            title={data.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={data.title}
            className="relative w-full h-full group"
          >
            <img
              src={thumbnail}
              alt={data.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <svg
                className="w-16 h-16 text-white drop-shadow-lg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="uppercase tracking-wide  text-indigo-500 font-semibold block mt-1 text-lg leading-tight  hover:underline"
        >
          {data.title}
        </a>
        <p className="mt-2 text-gray-500 text-left indent-2.5	">{data.description}</p>
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
