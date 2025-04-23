import React, { useEffect, useState } from "react";
import { FaTh, FaList, FaSortDown, FaSortUp, FaSort, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { HoverEffect } from "../../ui/card-hover-effect";

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [view, setView] = useState('list');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [nameFilter, setNameFilter] = useState("");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND}/invoices/admin`);
        if (!response.ok) {
          console.error(`Failed to fetch invoices: ${response.statusText}`);
          return;
        }
        const data = await response.json();
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSortOptions = () => {
    setShowSortOptions((prev) => !prev);
    setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch((prev) => !prev);
    setShowSortOptions(false);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.show.toLowerCase().includes(nameFilter.toLowerCase())
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = String(a[sortField] || "").toLowerCase();
    const bValue = String(b[sortField] || "").toLowerCase();
    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  return (
    <div className="p-4 sm:p-8 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Link
        to="/admin/dashboard"
        className="mb-4 sm:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
      >
        <FaArrowLeft className="w-4 h-4 mr-2" />
        Return to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">Manage Invoices</h1>

      {/* Control Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            onClick={toggleSearch}
            className={`p-2 rounded-full transition-colors ${
              showSearch ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
            } text-white`}
          >
            <FaSearch className="text-lg sm:text-xl" />
          </button>

          {/* Sort Toggle */}
          <button
            onClick={toggleSortOptions}
            className={`p-2 rounded-full transition-colors ${
              showSortOptions ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
            } text-white`}
          >
            <FaSort className="text-lg sm:text-xl" />
          </button>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-full transition-colors ${
              view === 'grid' 
                ? 'bg-neutral-700 text-white' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaTh className="text-lg sm:text-xl" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-full transition-colors ${
              view === 'list' 
                ? 'bg-neutral-700 text-white' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaList className="text-lg sm:text-xl" />
          </button>
        </div>
      </div>

      {/* Control Panels Container */}
      <div className="mb-4">
        {/* Search Panel */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full px-4 pr-10 py-2 rounded-full bg-white/10 text-white placeholder:text-white/50 outline-none transition-all duration-300 border border-white/20 focus:border-white/40"
                />
                <FaSearch className="absolute right-3 text-white/50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sort Options */}
        <AnimatePresence>
          {showSortOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 p-4 bg-neutral-800 rounded-lg">
                <button
                  onClick={() => handleSort('show')}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Name
                </button>
                <button
                  onClick={() => handleSort('venue')}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Venue
                </button>
                <button
                  onClick={() => setShowSortOptions(false)}
                  className="px-3 sm:px-4 py-2 bg-neutral-600 text-white rounded-full hover:bg-neutral-500 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Summary */}
      {nameFilter && (
        <div className="mb-4 text-xs sm:text-sm text-neutral-400">
          Search: "{nameFilter}"
        </div>
      )}

      {/* Content Area */}
      {view === 'list' ? (
        <div className="w-full flex justify-center">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="p-3 sm:p-4 text-left text-white cursor-pointer whitespace-nowrap text-sm sm:text-base">
                    <div className="flex items-center">
                      Show
                      <span className="ml-2">
                        {sortField === 'show' ? (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
                      </span>
                    </div>
                  </th>
                  <th className="p-3 sm:p-4 text-left text-white cursor-pointer whitespace-nowrap hidden sm:table-cell text-sm sm:text-base">
                    <div className="flex items-center">
                      Venue
                      <span className="ml-2">
                        {sortField === 'venue' ? (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
                      </span>
                    </div>
                  </th>
                  <th className="p-3 sm:p-4 text-left text-white whitespace-nowrap hidden md:table-cell text-sm sm:text-base">
                    Invoice #
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/invoices/${invoice._id}`)}
                  >
                    <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                      <div className="flex flex-col">
                        <span>{invoice.show}</span>
                        <span className="text-neutral-400 text-xs mt-1 sm:hidden">
                          {invoice.venue}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-white hidden sm:table-cell text-sm sm:text-base">{invoice.venue}</td>
                    <td className="p-3 sm:p-4 text-white hidden md:table-cell text-sm sm:text-base">{invoice._id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <HoverEffect
            items={sortedInvoices.map((invoice) => ({
              title: (
                <div className="text-base sm:text-lg font-bold flex justify-between items-center mt-0">
                  <span className="mt-0">{invoice.show}</span>
                </div>
              ),
              description: (
                <div className="flex flex-col text-xs sm:text-sm mt-0 space-y-1">
                  <p className="text-gray-300">Venue: {invoice.venue}</p>
                  <p className="text-gray-400">Invoice #: {invoice._id}</p>
                </div>
              ),
              link: `/admin/invoices/${invoice._id}`,
              _id: invoice._id,
              onClick: () => navigate(`/admin/invoices/${invoice._id}`)
            }))}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-0"
          />
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
