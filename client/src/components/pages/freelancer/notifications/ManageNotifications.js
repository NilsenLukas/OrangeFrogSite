import React from "react";
import { Link } from "react-router-dom";
import ViewNotifications from "./ViewNotifications";

const ManageNotifications = () => {
  return (
    <div className="flex flex-col w-full h-full min-h-screen p-8 bg-gray-100 dark:bg-neutral-900">

      
      <ViewNotifications />
    </div>
  );
};

export default ManageNotifications;