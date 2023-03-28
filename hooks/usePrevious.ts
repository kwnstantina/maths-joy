import { useRef } from "react";

type Props=string | number| null | boolean | any;

const usePrevious = (value:Props) => {
    const ref = useRef({
      value: value,
      prev: null,
    });
    const current = ref.current.value;
    if (value !== current) {
      ref.current = {
        value: value,
        prev: current as any,
      };
    }

    return ref.current.prev;
};

 
  export default usePrevious;