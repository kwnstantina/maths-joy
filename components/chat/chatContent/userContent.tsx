import { starterLetters } from "utils/utils";

type Props = {
  users: {
    data: Array<any>;
  };
};

const UserContent = (props: Props) => {
  const { users } = props;
  return (
    <>
      {users?.data?.map((item: any) => {
        return (
          <li key={item.id}>
            <button className="w-full flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none">
              <div className="relative flex items-center space-x-4">
                <div className="relative">
                  <span className="absolute text-green-500 right-0 bottom-0">
                    <svg width="20" height="20">
                      <circle cx="10" cy="10" r="10" fill="white"></circle>
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill={item.isActive ? "green" : "grey"}
                      ></circle>
                    </svg>
                  </span>
                  {item?.profilePicture ? (
                    <img
                      className=" w-10 h-10  sm:w-16 h-10 sm:h-16 rounded-full"
                      src={item.profilePicture}
                      alt="username"
                    />
                  ) : (
                    <div
                      className="text-center items-center  w-10 h-10  sm:w-16 h-10 sm:h-16 rounded-full "
                      style={{
                        background:item.color             
                      }}
                    >
                      <p className="text-lg p-[16px]">
                        {starterLetters(
                         item?.firstName,
                          item?.lastName
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="block ml-2 font-semibold text-gray-600">
                    {item.firstName + " " + item.lastName}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </>
  );
};

export default UserContent;
