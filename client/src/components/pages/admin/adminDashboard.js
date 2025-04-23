import React from "react";
import { useNavigate } from "react-router-dom";
import { IconCalendarEvent, IconUsers } from "@tabler/icons-react";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Split welcome text into individual characters
  const welcomeText = "Welcome,".split("");

  const menuItems = [
    { path: "/admin/manage-events", icon: IconCalendarEvent, title: "Manage Events", description: "Create and manage events, assign contractors, and track progress." },
    { path: "/admin/manage-users", icon: IconUsers, title: "Manage Users", description: "Manage user accounts, permissions, and access levels." },
    { path: "/admin/invoices", icon: IconCalendarEvent, title: "Manage Invoices", description: "View and manage all invoices." },
    { path: "/admin/manage-corrections", icon: IconCalendarEvent, title: "Manage Correction Reports", description: "View and manage correction reports and track progress." },
    { path: "/admin/manage-job-comments", icon: IconCalendarEvent, title: "Manage Job Comments", description: "View and manage job comments." }
  ];

  const MenuCard = ({ item }) => (
    <div
      className="relative group cursor-pointer"
      onClick={() => navigate(item.path)}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative bg-neutral-900 dark:bg-neutral-800 text-white rounded-xl p-4 sm:p-6 shadow-lg flex flex-col items-center gap-3 sm:gap-4">
        <item.icon className="w-8 h-8 sm:w-12 sm:h-12 text-teal-400" />
        <h2 className="text-lg sm:text-xl font-semibold text-center">{item.title}</h2>
        <p className="text-xs sm:text-sm text-neutral-400 text-center">
          {item.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-neutral-900">
      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8">
        {/* Animated Welcome Section */}
        <div className="w-full mb-8 sm:mb-20">
          <div className="flex justify-center mb-4">
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
                className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400"
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
              className="text-3xl sm:text-5xl font-bold text-neutral-900 dark:text-white py-4"
            >
              Admin
            </motion.h1>
          </motion.div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {menuItems.map((item, index) => (
            <MenuCard key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
