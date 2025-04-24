import React from "react";
import ViewNotifications from "./ViewNotifications";

const ManageNotifications = () => {
  return (
    <div className="flex flex-col w-full h-full min-h-screen p-8 bg-gray-100 dark:bg-neutral-900">

      {/* Displays View Notifications Page */}
      <ViewNotifications />
    </div>
  );
};

export default ManageNotifications;