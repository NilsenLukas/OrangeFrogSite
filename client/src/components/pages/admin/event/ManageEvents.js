import React from "react";
import { Link } from "react-router-dom";
import ViewEvent from "./ViewEvent";

const ManageEvents = () => {
  return (
    <div className="flex flex-col w-full h-full min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-neutral-900">
      <Link 
        to="/admin/dashboard"
        className="mb-4 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors"
      >
        <svg 
          className="w-4 h-4 md:w-5 md:h-5 mr-2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm md:text-base">Return to Dashboard</span>
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 text-center">
        Manage Events
      </h1>
      
      {/* Displays View Events Page */}
      <ViewEvent />
    </div>
  );
};

export default ManageEvents;
