import { MailIcon, DeviceMobileIcon } from "@heroicons/react/outline";

const SocialIcons = () => {
  return (
    <div className="text-blue-500">
      <span
        className="p-2 cursor-pointer inline-flex items-center
        rounded-full bg-gray-300 mx-1.5 text-xl hover:text-blue-100 hover:bg-teal-500
        duration-300">
       <MailIcon className='w-6'/>
      </span>
    </div>
  );
};

export default SocialIcons;