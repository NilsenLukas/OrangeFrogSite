import React from "react";
import { Link } from "react-router-dom";
import ViewUsers from "./ViewUsers";

const ManageUsers = () => {
  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900">
      <div className="p-4 md:p-8">
        <Link 
          to="/admin/dashboard"
          className="mb-8 flex items-center text-neutral-400 hover:text-white transition-colors"
        >
          <svg 
            className="w-5 h-5 mr-2" 
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

        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Manage Users
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Displays View Users Page */}
        <ViewUsers />
      </div>
    </div>
  );
};

export default ManageUsers;
