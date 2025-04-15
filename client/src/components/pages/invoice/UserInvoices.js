import React, { useEffect, useState, useContext } from "react";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSortUp, FaSortDown, FaSearch, FaFilter, FaArrowLeft, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../AuthContext";
import { HoverEffect } from "../../ui/card-hover-effect";
import { toast } from 'sonner';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-sm sm:text-base text-neutral-400">Loading invoices...</p>
    </div>
);

const UserInvoices = () => {
    const { auth } = useContext(AuthContext);
    const [invoices, setInvoices] = useState([]);
    const [isGridView, setIsGridView] = useState(true);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [eligibleEvents, setEligibleEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nameFilter, setNameFilter] = useState("");
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

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
                toast.error("Failed to load invoices");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, [auth.userId]);

    useEffect(() => {
        if (showModal) {
            fetch(`${process.env.REACT_APP_BACKEND}/events/eligible-events/${auth.userId}`)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => setEligibleEvents(data))
                .catch((error) => {
                    console.error("Error fetching eligible events:", error);
                    toast.error("Failed to load eligible events");
                });
        }
    }, [showModal, auth.userId]);

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

    const toggleSearch = () => {
        setShowSearch(prev => !prev);
        setShowFilterPanel(false);
        setShowSortOptions(false);
    };

    const toggleFilterPanel = () => {
        setShowFilterPanel(prev => !prev);
        setShowSearch(false);
        setShowSortOptions(false);
    };

    const toggleSortOptions = () => {
        setShowSortOptions(prev => !prev);
        setShowSearch(false);
        setShowFilterPanel(false);
    };

    const getFilteredInvoices = () => {
        return sortedInvoices.filter(invoice => {
            const matchesName = invoice.show.toLowerCase().includes(nameFilter.toLowerCase());
            return matchesName;
        });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col w-full min-h-screen h-full p-4 sm:p-6 md:p-8 bg-neutral-900">
            <Link
                to="/user/dashboard"
                className="mb-4 sm:mb-6 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
            >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
            </Link>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
                Generate Invoices
            </h1>

            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
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

                    {/* Filter Toggle */}
                    <button
                        onClick={toggleFilterPanel}
                        className={`p-2 rounded-full transition-colors ${
                            showFilterPanel ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
                        } text-white`}
                    >
                        <FaFilter className="text-lg sm:text-xl" />
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
                        onClick={() => setIsGridView(true)}
                        className={`p-2 rounded-full transition-colors ${
                            isGridView 
                                ? 'bg-neutral-700 text-white' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                    >
                        <FaTh className="text-lg sm:text-xl" />
                    </button>
                    <button
                        onClick={() => setIsGridView(false)}
                        className={`p-2 rounded-full transition-colors ${
                            !isGridView 
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
                                    placeholder="Search by show"
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
                                    onClick={() => handleSort("show")}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Show
                                </button>
                                <button
                                    onClick={() => handleSort("venue")}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Venue
                                </button>
                                <button
                                    onClick={() => handleSort("createdAt")}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Created Date
                                </button>
                                <button
                                    onClick={() => handleSort("updatedAt")}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Last Modified
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Generate Invoice Button */}
            <div className="flex justify-center mb-6">
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 rounded-lg bg-black text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <FaPlus className="text-lg" />
                    Generate Invoice
                </button>
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
                                            <div className="text-lg font-semibold text-white flex justify-between items-center">
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
                            <div className="overflow-x-auto rounded-lg">
                                <table className="min-w-full bg-neutral-800/50">
                                    <thead className="bg-neutral-700">
                                        <tr>
                                            <th
                                                className="p-3 sm:p-4 text-left text-white cursor-pointer"
                                                onClick={() => handleSort("show")}
                                            >
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Show
                                                    <span className="ml-2">
                                                        {sortField === "show" ? (
                                                            sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                                                        ) : (
                                                            <FaSort />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="p-3 sm:p-4 text-left text-white cursor-pointer"
                                                onClick={() => handleSort("venue")}
                                            >
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Venue
                                                    <span className="ml-2">
                                                        {sortField === "venue" ? (
                                                            sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                                                        ) : (
                                                            <FaSort />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="p-3 sm:p-4 text-left text-white text-sm sm:text-base">
                                                Invoice #
                                            </th>
                                            <th
                                                className="p-3 sm:p-4 text-left text-white cursor-pointer"
                                                onClick={() => handleSort("createdAt")}
                                            >
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Created Date
                                                    <span className="ml-2">
                                                        {sortField === "createdAt" ? (
                                                            sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                                                        ) : (
                                                            <FaSort />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="p-3 sm:p-4 text-left text-white cursor-pointer"
                                                onClick={() => handleSort("updatedAt")}
                                            >
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Last Modified
                                                    <span className="ml-2">
                                                        {sortField === "updatedAt" ? (
                                                            sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />
                                                        ) : (
                                                            <FaSort />
                                                        )}
                                                    </span>
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
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                    {invoice.show}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                    {invoice.venue}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                    {invoice._id}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                    {new Date(invoice.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
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
                        <FaRegSadTear className="w-16 h-16 text-neutral-400 mb-4" />
                        <h2 className="text-xl font-semibold text-neutral-300 mb-2">
                            No Invoices Found
                        </h2>
                        <p className="text-neutral-400">
                            There are currently no invoices available to display.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Event Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-neutral-900 p-6 rounded-lg w-full max-w-lg shadow-lg">
                        <h2 className="text-xl text-white font-bold mb-4">Select an Event to Generate Invoice</h2>

                        <div className="max-h-60 overflow-y-auto mb-4">
                            {eligibleEvents.length > 0 ? (
                                eligibleEvents.map((event) => (
                                    <div
                                        key={event._id}
                                        className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md cursor-pointer mb-2"
                                        onClick={() => handleEventSelection(event)}
                                    >
                                        <p className="font-bold">{event.eventName}</p>
                                        <p className="text-sm text-neutral-400">
                                            {new Date(event.eventLoadIn).toLocaleDateString()}
                                        </p>
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
                            className="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInvoices;