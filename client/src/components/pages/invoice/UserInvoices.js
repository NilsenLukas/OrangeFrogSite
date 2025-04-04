import React, { useEffect, useState, useContext } from "react";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";
import { HoverBorderGradient } from '../../ui/hover-border-gradient';
import { HoverEffect } from "../../ui/card-hover-effect";


const UserInvoices = () => {
  const { auth } = useContext(AuthContext); // Access user authentication context
  const [invoices, setInvoices] = useState([]); // State for storing invoices
  const [isGridView, setIsGridView] = useState(true); // View toggle (grid or table)
  const [sortField, setSortField] = useState(null); // Field to sort by
  const [sortDirection, setSortDirection] = useState("asc"); // Sorting direction
  const navigate = useNavigate(); // Navigation hook for redirects
  const [showModal, setShowModal] = useState(false);
  const [eligibleEvents, setEligibleEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState(""); // Define nameFilter state
  const [showSortOptions, setShowSortOptions] = useState(false); // Define showSortOptions state
  const [animateSortOptions, setAnimateSortOptions] = useState(false); // Define animateSortOptions state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' }); // Define sortConfig

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!auth.userId) {
        console.error("User ID is missing in auth context");
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices/user/${auth.userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }
        const data = await response.json();
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [auth.userId]);

  useEffect(() => {
    if (showModal) {
      fetch(`${process.env.REACT_APP_BACKEND}/events/eligible-events/${auth.userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setEligibleEvents(data))
        .catch((error) => console.error("Error fetching eligible events:", error));
    }
    
  }, [showModal]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEventSelection = (event) => {
    setShowModal(false);
    navigate(`/user/invoices/new?eventId=${event._id}`);
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = String(a[sortField] || "").toLowerCase();
    const bValue = String(b[sortField] || "").toLowerCase();
    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const toggleSortOptions = () => {
    setShowSortOptions((prev) => !prev);
    setAnimateSortOptions(true);
  };

  const cancelSortOptions = () => {
    setAnimateSortOptions(false);
    setShowSortOptions(false);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  // Update the filteredInvoices function to match FindJobs.js style
  const getFilteredInvoices = () => {
    return sortedInvoices.filter(invoice => {
      const matchesName = invoice.show.toLowerCase().includes(nameFilter.toLowerCase());
      return matchesName;
    });
  };

  if (isLoading) {
    return <p>Loading invoices...</p>;
  }

  return (
    <div className="p-8 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Link
        to="/user/dashboard"
        className="mb-0 flex items-center text-gray-300 hover:text-white transition-colors"
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

      <div className="p-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
          Generate Invoices
        </h1>

        <div className="flex flex-col items-center mb-2">
            <div className="flex justify-between items-center w-full mt-4">
                     
            {/* Left side: Search + Sort button */}
            <div className="flex gap-4">
                
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by show"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="px-4 py-2 bg-neutral-800 text-white rounded transition-colors outline-none w-48 mt-5"
                />
              </div>

              <AnimatePresence>
                {!showSortOptions && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={toggleSortOptions}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors mt-5 ${
                      showSortOptions
                        ? "bg-neutral-700 text-white"
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    <FaSort className="text-xl" />
                    <span className="whitespace-nowrap">Sort by</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showSortOptions && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: animateSortOptions ? 0 : 1, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 mt-5"
                  >
                    <span className="text-white whitespace-nowrap">Sort by:</span>

                    {/* Adjust these sort buttons for your fields */}
                    <button
                      className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                        rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                      onClick={() => handleSort("show")}
                    >
                      Show
                    </button>

                    <button
                      className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                        rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                      onClick={() => handleSort("venue")}
                    >
                      Venue
                    </button>

                    <button
                      className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                        rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created Date
                    </button>

                    <button
                      className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                        rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                      onClick={() => handleSort("updatedAt")}
                    >
                      Last Modified
                    </button>

                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: 0.2 }}
                      type="button"
                      onClick={cancelSortOptions}
                      className="h-9 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors mt-0 whitespace-nowrap"
                    >
                      Cancel
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            

            {/* Right side: Toggle view */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2 rounded transition-colors ${
                  isGridView
                    ? "bg-neutral-700 text-white"
                    : "bg-neutral-800 text-white hover:bg-neutral-700"
                }`}
              >
                <FaTh className="text-xl" />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2 rounded transition-colors ${
                  !isGridView
                    ? "bg-neutral-700 text-white"
                    : "bg-neutral-800 text-white hover:bg-neutral-700"
                }`}
              >
                <FaList className="text-xl" />
              </button>
            </div>
          </div>
          
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div onClick={() => setShowModal(true)} className="cursor-pointer">
          {/* <div onClick={() => { console.log("clicked!"); setShowModal(true); }} className="cursor-pointer"> */}
            <HoverBorderGradient
              containerClassName="rounded-full mt-0"
              className="dark:bg-black bg-neutral-900 text-white flex items-center space-x-2 mt-0 px-4 py-2"
            >
              <span className="text-lg mr-1 mt-0">+</span> 
              <span>Generate Invoice</span>
            </HoverBorderGradient>
          </div>
        </div>

        {/* Main content area */}
        <AnimatePresence>
          {getFilteredInvoices().length > 0 ? (
            <>
              {isGridView ? (
                // GRID VIEW
                <div className="w-full">
                  <HoverEffect
                    items={getFilteredInvoices().map((invoice) => ({
                      title: (
                        <div className="text-lg font-semibold text-white flex justify-between items-center pt-0">
                          <span>{invoice.show}</span>
                        </div>
                      ),
                      description: (
                        <div className="flex flex-col space-y-2 text-sm">
                          <p className="text-gray-300">Venue: {invoice.venue}</p>
                          <p className="text-gray-400">Invoice #: {invoice._id}</p>
                        </div>
                      ),
                      link: invoice._id
                        ? `/user/invoices/${invoice._id}`
                        : `/user/invoices/new?eventId=${invoice.eventId}`,
                      _id: invoice._id || invoice.eventId,
                      onClick: () => {
                        if (invoice._id) {
                          navigate(`/user/invoices/${invoice._id}`);
                        } else {
                          navigate(`/user/invoices/new?eventId=${invoice.eventId}`);
                        }
                      }
                    }))}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  />
                </div>
              ) : (
                // TABLE VIEW
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
                    <thead className="bg-neutral-700">
                      <tr>
                        <th
                          className="p-4 text-left text-white cursor-pointer"
                          onClick={() => handleSort("show")}
                          
                        >
                          <div className="flex items-center">
                            Show
                            <span className="ml-2">{getSortIcon("show")}</span>
                          </div>
                        </th>
                        <th
                          className="p-4 text-left text-white cursor-pointer"
                          onClick={() => handleSort("venue")}
                        >
                          <div className="flex items-center">
                            Venue
                            <span className="ml-2">{getSortIcon("venue")}</span>
                          </div>
                        </th>
                        <th className="p-4 text-left text-white">
                          Invoice #
                        </th>
                        <th
                          className="p-4 text-left text-white cursor-pointer"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            Created Date
                            <span className="ml-2">{getSortIcon("createdAt")}</span>
                          </div>
                        </th>
                        <th
                          className="p-4 text-left text-white cursor-pointer"
                          onClick={() => handleSort("updatedAt")}
                        >
                          <div className="flex items-center">
                            Last Modified
                            <span className="ml-2">{getSortIcon("updatedAt")}</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredInvoices().map((invoice) => (
                        <tr
                          key={invoice._id}
                          className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (invoice._id) {
                                navigate(`/user/invoices/${invoice._id}`);
                            } else {
                                navigate(`/user/invoices/new?eventId=${invoice.eventId}`);
                            }
                          }}
                        >
                          <td className="p-4 text-white">{invoice.show}</td>
                          <td className="p-4 text-white">{invoice.venue}</td>
                          <td className="p-4 text-white">{invoice._id}</td>
                          <td className="p-4 text-white">
                            {new Date(invoice.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-white">
                            {new Date(invoice.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
            </>
          ) : (
            // NO ITEMS
            <motion.div
              className="flex flex-col items-center justify-center flex-1 min-h-[400px] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaRegSadTear className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                No Invoices Found
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                There are currently no invoices available to display.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-8 bg-gray-100 dark:bg-neutral-900 min-h-screen">

  {/* All your return content here */}

  {/* MODAL: Move it outside conditionally filtered sections */}
  {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-lg shadow-lg flex justify-center flex-col">
        <h2 className="text-xl text-white font-bold mb-4">Select an Event to Generate Invoice</h2>

        <div className="flex justify-between items-center flex-col mb-4">
          <div className="max-h-60 overflow-y-auto">
            {eligibleEvents.length > 0 ? (
              eligibleEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md cursor-pointer mb-2"
                  onClick={() => handleEventSelection(event)}
                >
                  <p className="font-bold">{event.eventName}</p>
                  <p className="text-sm text-neutral-400">{new Date(event.eventLoadIn).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-center mt-4">
                No eligible events found. You may have already generated invoices for all of them.
              </p>
            )}
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors flex justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
</div>

      
    </div>
  );
};

export default UserInvoices;