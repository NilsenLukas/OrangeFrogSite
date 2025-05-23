// User Dashboard Page
// Display each of the user's accessible pages
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

  // User page options
  const menuItems = [
    { path: "/user/find-jobs", icon: IconCalendarEvent, title: "Find Jobs", description: "Browse and apply for available job opportunities." },
    { path: "/user/current-jobs", icon: IconUsers, title: "Current Jobs", description: "View and manage your current job assignments." },
    { path: "/user/time-card", icon: IconUsers, title: "Time Card", description: "Record and track your work hours efficiently." },
    { path: "/user/manage-corrections", icon: IconUsers, title: "Manage Correction Reports", description: "Create, view, and manage your correction reports." },
    { path: "/user/invoices", icon: IconCalendarEvent, title: "My Invoices", description: "View and track your personal invoices." },
    { path: "/user/manage-job-comments", icon: IconCalendarEvent, title: "Manage Job Comments", description: "View and manage job comments." }
  ];

  const MenuCard = ({ item }) => (
    <div
      className="relative group cursor-pointer"
      onClick={() => navigate(item.path)}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-3 sm:p-4 md:p-6 shadow-lg flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
        <item.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-teal-400" />
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-center">{item.title}</h2>
        <p className="text-xs sm:text-sm text-neutral-400 text-center">
          {item.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-neutral-900">
      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        {/* Animated Welcome Section */}
        <div className="w-full mb-4 sm:mb-8 md:mb-12 lg:mb-20">
          <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
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
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400"
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
              className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-neutral-900 dark:text-white py-2 sm:py-3 md:py-4"
            >
              {userName || "User"}
            </motion.h1>
          </motion.div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
          {/* Displays each menu option */}
          {menuItems.map((item, index) => (
            <MenuCard key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
