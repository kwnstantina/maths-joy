import { Link } from "@remix-run/react";

type Props={
    children:any,
    title:string;
    content:string;
    additionStyle:string;
    link:string;
}

const Box = (props:Props) => {
    const {title, content,additionStyle,link} = props;
  return(
    <Link to={link}>
    <div className="flex flex-col md:space-y-24 text-center sm:space-y-10 ml-8">
    <div className="flex flex-col  space-y-2 md:w-1/2">
      <div
      className={additionStyle}
      >
        {props.children}
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="max-w-md break-words">
           {content}
          </p>
        </div>
      </div>
    </div>
  </div> 
  </Link>
  );
};

export default Box;
