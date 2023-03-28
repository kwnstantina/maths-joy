import React from "react";

const LoadingPage = (): JSX.Element => {
  return (
    <>
      <div
        className="container w-full h-screen mt-16  mb-24"
        style={{ marginBottom: "10rem" }}
      >
        <div role="status" className="space-y-2.5 animate-pulse max-w-xl p-4">
          <div className="flex items-center w-full space-x-2">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[500px]">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[490px]">
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[480px]">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[440px]">
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-32"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[360px]">
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"></div>
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
          </div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </>
  );
};

export default LoadingPage;
