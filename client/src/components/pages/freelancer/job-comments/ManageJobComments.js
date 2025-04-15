import React from "react";
import { Link } from "react-router-dom";
import ViewJobComments from "./ViewJobComments";

const ManageJobComments = () => {
  return (
    <div className="flex flex-col w-full h-full min-h-screen p-8 bg-gray-100 dark:bg-neutral-900">

      
      <ViewJobComments />
    </div>
  );
};

export default ManageJobComments;