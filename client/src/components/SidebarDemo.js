"use client";
import React, { useState, useContext } from "react";
import { Sidebar, SidebarBody } from "./ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconUserBolt,
  IconHome,
  IconBell,
  IconMenu2,
  // IconCalendarEvent,
  // IconUsers,
} from "@tabler/icons-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { cn } from "../lib/utils";
import { AuthContext } from "../AuthContext";

export default function SidebarDemo({ role }) {
  const [open, setOpen] = useState(false); // Sidebar collapse state
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  // Admin Sidebar Links
  const adminLinks = [
    {
      label: "Dashboard",
      key: "dashboard",
      path: "/admin/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      key: "profile",
      path: "/admin/profile",
      icon: (
        <IconUserBolt className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Notifications",
      key: "notifiications",
      path: "/admin/notifications",
      icon: (
        <IconBell className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Logaout",
      key: "logout",
      path: "/",
      icon: (
        <IconArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
  ];

  // User Sidebar Links
  const userLinks = [
    {
      label: "Dashboard",
      key: "dashboard",
      path: "/user/dashboard",
      icon: (
        <IconHome className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      key: "profile",
      path: "/user/profile",
      icon: (
        <IconUserBolt className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Notifications",
      key: "notifiications",
      path: "/user/notifications",
      icon: (
        <IconBell className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      key: "logout",
      path: "/",
      icon: (
        <IconArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200 flex-shrink-0" />
      ),
    },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  // Navigate to the selected tab
  const handleNavigation = (path, key) => {
    if (key === "logout") {
      logout();
      navigate("/");
    } else {
      navigate(path);
    }
  };

  return (
    <div className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-full mx-auto border border-neutral-200 dark:border-neutral-700",
        "min-w-[100px] h-screen overflow-hidden"
    )}>
        {/* Hamburger Button - Only visible on mobile */}
        <button
            onClick={() => setOpen(!open)}
            className="fixed top-4 right-2 z-50 p-2 rounded-sm w-10 bg-neutral-900 text-white md:hidden"
        >
            <IconMenu2 className="w-6 h-6" />
        </button>

        {/* Sidebar Component - Hidden on mobile by default */}
        <div className={cn(
            "fixed md:relative z-40 transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="flex flex-col justify-between h-full gap-4 sm:gap-10">
                    {/* Sidebar Content */}
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-4 sm:mt-8 flex flex-col gap-1 sm:gap-2">
                            {links
                                .filter((link) => link.key !== "logout")
                                .map((link) => (
                                    <div
                                        key={link.key}
                                        onClick={() => {
                                            handleNavigation(link.path, link.key);
                                            setOpen(false); // Close sidebar after navigation on mobile
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 sm:px-4 py-1 sm:py-2 cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700",
                                            location.pathname === link.path && "bg-neutral-100 dark:bg-neutral-700"
                                        )}
                                    >
                                        {link.icon}
                                        <span className="text-sm sm:text-base text-neutral-700 dark:text-neutral-200">
                                            {link.label}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="p-2 sm:p-4">
                        <button
                            onClick={() => {
                                handleNavigation("/", "logout");
                                setOpen(false); // Close sidebar after logout
                            }}
                            className={cn(
                                "flex items-center gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors",
                                open ? "justify-start" : "justify-center"
                            )}
                        >
                            <IconArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            {open && <span className="text-sm sm:text-base">Logout</span>}
                        </button>
                    </div>
                </SidebarBody>
            </Sidebar>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {open && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setOpen(false)}
            />
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-2 sm:p-6">
                <Outlet />
            </div>
        </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <img
        src={require("../images/orange-frog-logo.png")}
        alt="Orange Frog Logo"
        className="h-8 w-8 flex-shrink-0"
      />
      <span className="font-medium text-white whitespace-pre">
        Orange Frog Production
      </span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <img
        src={require("../images/orange-frog-logo.png")}
        alt="Orange Frog Logo"
        className="h-8 w-8 flex-shrink-0"
      />
    </a>
  );
};
