import React from "react";
import { Link } from "react-router-dom";
import ViewJobComments from "./ViewJobComments";

const ManageJobComments = () => {
  return (
    <div className="flex flex-col w-full h-full min-h-screen p-4 sm:p-8 bg-gray-100 dark:bg-neutral-900">
      <Link 
        to="/admin/dashboard"
        className="mb-4 sm:mb-8 flex items-center text-sm sm:text-base text-neutral-400 hover:text-white transition-colors"
      >
        <svg 
          className="w-4 h-4 sm:w-5 sm:h-5 mr-2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Return to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 text-center">
        Manage Job Comments
      </h1>
      
      {/* Displays View Job Comments Page */}
      <ViewJobComments />
    </div>
  );
};

export default ManageJobComments;
