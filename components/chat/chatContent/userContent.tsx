import React from "react";

type Props = {
 users: {
    data: Array<any>
 }
};

const UserContent = (props: Props) => {
  const { users } = props;
  return (
    <>
      {users?.data?.map((item: any) => {
        return (
          <li key={item.id}>
            <a className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
              <img
                className="object-cover w-10 h-10 rounded-full"
                src="https://cdn.pixabay.com/photo/2018/09/12/12/14/man-3672010__340.jpg"
                alt="username"
              />
              <div className="w-full pb-2">
                <div className="flex justify-between">
                  <span className="block ml-2 font-semibold text-gray-600">
                    {item.firstName +' '+  item.lastName}
                  </span>
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </>
  );
};

export default UserContent;
