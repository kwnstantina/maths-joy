import { useEffect } from "react";


const useDetectOutside=(ref: any,handleClick:Function)=> {
    useEffect(() => {

      function handleClickOutside(event: { target: any; }) {
        if (ref.current && !ref.current.contains(event.target)) {
            handleClick();
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {

        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  export default useDetectOutside;