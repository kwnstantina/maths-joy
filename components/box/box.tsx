import { Link } from "@remix-run/react";

type Props = {
  children?: any;
  title: string;
  content?: string;
  additionStyle?: string;
};

const Box = (props: Props) => {
  const { title, content, additionStyle } = props;
  return (
    <div className="flex flex-col md:space-y-24 sm:space-y-10 ml-6 xs:mt-[-30px] sm:mt-[-30px] md:mt-0 lg:mt-0 xl:mt-0 2xl:mt-0">
      <div className="flex flex-col space-y-2 md:w-[66%]	">
        <div className={additionStyle}>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="break-words my-6">{content}</p>
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Box;
