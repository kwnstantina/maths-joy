import svg2 from "../assets/svg/svg3.svg";
import VideoList from "components/video/videoList";
import { LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getTutorialsWithPagination } from "../utils/tutorial.server";

export const loader: LoaderFunction = async (remixContext) => {
  const url = new URL(remixContext.request.url);
  const page = url.searchParams.get("page") || 0;
  const items = await getTutorialsWithPagination(Number(page));
  return items;
};

const InfiniteScroller = (props: {
  children: any;
  loading: boolean;
  loadNext: () => void;
}) => {
  const { children, loading, loadNext } = props;
  const scrollListener = useRef(loadNext);

  useEffect(() => {
    scrollListener.current = loadNext;
  }, [loadNext]);

  const onScroll = () => {
    const documentHeight = document.documentElement.scrollHeight;
    const scrollDifference = Math.floor(window.innerHeight + window.scrollY);
    const scrollEnded = documentHeight == scrollDifference;

    if (scrollEnded && !loading) {
      scrollListener.current();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <>{children}</>;
};

const Tutorial = () => {
  const initialItems = useLoaderData();
  const fetcher = useFetcher();

  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    if (fetcher.data) {
      const newItems = fetcher.data.data;
      setItems((prev: any) => [...prev, ...newItems]);
    }
  }, [fetcher.data]);
  

  return (
    <div className="container mx-auto text-center pb-52 flex justify-start  sm:flex-col md:flex-row">
      <div>
        <img src={svg2} alt="Γρηγόρης Κυρτσιάς" />
      </div>

     
        <InfiniteScroller
          loadNext={() => {
            const page = fetcher.data
              ? fetcher.data.page + 1
              : initialItems.page + 1;
            const query = `?index&page=${page}`;
            return query;
          }}
          loading={fetcher.state === "loading"}
        >
          <div>
            {items?.data?.map(
              (item: {
                id: string;
                url: string;
                title: string;
                description: string;
                creatorName: string;
                tags: string[];
                createdAt: string;
              }) => (
                <VideoList data={item} key={item.id}></VideoList>
              )
            )}

            <div className="loader-container">
              {fetcher.state === "loading" && (
                <div className="lds-ellipsis">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              )}
            </div>
          </div>
        </InfiniteScroller>
 
    </div>
  );
};

export default Tutorial;
