import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IconCalendarEvent, IconUsers } from "@tabler/icons-react";
import { AuthContext } from "../../../AuthContext";
import { motion } from "framer-motion";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND}/user-profile/${auth.email}`);
        const data = await response.json();
        setUserName(data.name);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (auth.email) {
      fetchUserProfile();
    }
  }, [auth.email]);

  // Split welcome text into individual characters
  const welcomeText = "Welcome,".split("");
  
  return (
    <div className="flex flex-col items-center w-full min-h-screen h-full p-8 bg-gray-100 dark:bg-neutral-900 overflow-y-auto">
      {/* Animated Welcome Section */}
      <div className="w-full mb-4 sm:mb-20">
        <div className="flex justify-center mb-2 sm:mb-4">
          {welcomeText.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
              }}
              className="text-lg sm:text-2xl text-neutral-600 dark:text-neutral-400"
            >
              {letter}
            </motion.span>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="relative flex justify-center"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              delay: 1.2,
              duration: 1,
              ease: "easeOut"
            }}
            className="absolute bottom-0 h-[2px] bg-gradient-to-r from-blue-600 to-teal-600"
          />
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="text-2xl sm:text-5xl font-bold text-neutral-900 dark:text-white py-2 sm:py-4"
          >
            {userName || "User"}
          </motion.h1>
        </motion.div>
      </div>

      {/* Rest of dashboard content */}
      <div className="w-full overflow-y-auto max-h-[calc(100vh-200px)] sm:overflow-y-visible sm:max-h-full">
  {/* Grid content goes here */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 w-full ">
        {/* Find Jobs Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/find-jobs")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconCalendarEvent className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">Find Jobs</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              Browse and apply for available job opportunities.
            </p>
          </div>
        </div>

        {/* Current Jobs Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/current-jobs")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconUsers className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">Current Jobs</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              View and manage your current job assignments.
            </p>
          </div>
        </div>

        {/* Time Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/time-card")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconUsers className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">Time Card</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              Record and track your work hours efficiently.
            </p>
          </div>
        </div>

        {/* Correction Report Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/manage-corrections")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconUsers className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">Manage Correction Reports</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              Create, view, and manage your correction reports.
            </p>
          </div>
        </div>

        {/* My Invoices Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/invoices")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconCalendarEvent className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">My Invoices</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              View and track your personal invoices.
            </p>
          </div>
        </div>

        {/* Manage Event Job Comments Card */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/user/manage-job-comments")}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-4">
            <IconCalendarEvent className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
            <h2 className="text-lg sm:text-xl font-semibold">Manage Job Comments</h2>
            <p className="text-xs sm:text-sm text-neutral-400 text-center">
              View and manage job comments.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
