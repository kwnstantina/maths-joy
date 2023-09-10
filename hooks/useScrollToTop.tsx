import { useEffect } from "react";

type Props = {
  location: any;
  prevPath: string;
};
const useScrollToTop = (props:Props) => {
  const {location,prevPath} = props;
  useEffect(() => {
    if (location.pathname !== prevPath && location.pathname !== "/") {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
    }
  }, [location,prevPath]);

};

export default useScrollToTop;