// User Current Jobs Page
// Allows the user to view their accepted & approved jobs
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSearch, FaFilter, FaSortUp, FaSortDown, FaArrowLeft } from 'react-icons/fa';
import { HoverEffect } from "../../../ui/card-hover-effect";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-sm sm:text-base text-neutral-400">Loading jobs...</p>
    </div>
);

const CurrentJobs = () => {
    const { auth } = useContext(AuthContext);
    const [currentJobs, setCurrentJobs] = useState([]);
    const [isGridView, setIsGridView] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [animateSortOptions, setAnimateSortOptions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.email) {
            const fetchJobs = async () => {
                try {
                    setIsLoading(true);
                    // Gets user's applied & approved jobs
                    const response = await fetch(`${process.env.REACT_APP_BACKEND}/events/contractor/${auth.email}`);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Filter jobs based on status and dates
                        const currentDate = new Date();
                        const filteredJobs = data.filter(job => {
                            const loadInDate = new Date(job.eventLoadIn);
                            const deniedDate = job.deniedAt ? new Date(job.deniedAt) : null;
    
                            if (job.status === 'approved') {
                                return true;
                            }
                            else if (job.status === 'applied') {
                                return currentDate < loadInDate;
                            }
                            else if (job.status === 'denied' && deniedDate) {
                                const hoursSinceDenied = (currentDate - deniedDate) / (1000 * 60 * 60);
                                return hoursSinceDenied < 24;
                            }
                            return false;
                        });
    
                        setCurrentJobs(filteredJobs);
                    }
                } catch (error) {
                    console.error("Error fetching jobs:", error);
                    toast.error("Error fetching jobs");
                } finally {
                    setIsLoading(false);
                }
            };
    
            fetchJobs();
    
            // Refresh every minute to handle expired jobs
            const interval = setInterval(fetchJobs, 60000);
            return () => clearInterval(interval);
        }
    }, [auth.email]);

    const getStatusBadge = (status) => {
        const badges = {
            applied: "bg-yellow-500/10 text-yellow-500",
            approved: "bg-green-500/10 text-green-500",
            denied: "bg-red-500/10 text-red-500"
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs ${badges[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleEventClick = (eventID) => {
        navigate(`/user/events/${eventID}`);
    };

    const formatJobsForHoverEffect = (jobs) => {
        return jobs.map((job) => ({
            title: (
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{job.eventName}</span>
                    {getStatusBadge(job.status)}
                </div>
            ),
            description: (
                <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-neutral-400 font-medium">Load In:</p>
                            <div className="pl-2 border-l-2 border-neutral-700">
                                <p className="text-white">{new Date(job.eventLoadIn).toLocaleString()}</p>
                                <p className="text-neutral-300">Hours: {job.eventLoadInHours}h</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-neutral-400 font-medium">Load Out:</p>
                            <div className="pl-2 border-l-2 border-neutral-700">
                                <p className="text-white">{new Date(job.eventLoadOut).toLocaleString()}</p>
                                <p className="text-neutral-300">Hours: {job.eventLoadOutHours}h</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-neutral-400 font-medium">Location:</p>
                        <p className="text-white">{job.eventLocation}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-neutral-400 font-medium">Descriptio:</p>
                        <p className="text-white line-clamp-3">{job.eventDescription}</p>
                    </div>
                </div>
            ),
            link: `/user/events/${job._id}`,
            _id: job._id,
            onClick: (e) => {
                if (!e.defaultPrevented) {
                    handleEventClick(job._id);
                }
            }
        }));
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            return { key, direction };
        });
    };

    const sortedJobs = React.useMemo(() => {
        let sortedArray = [...currentJobs];
        if (sortConfig.key) {
            sortedArray.sort((a, b) => {
                const aVal = (sortConfig.key === 'totalHours') ? (a.eventLoadInHours + a.eventLoadOutHours) : a[sortConfig.key];
                const bVal = (sortConfig.key === 'totalHours') ? (b.eventLoadInHours + b.eventLoadOutHours) : b[sortConfig.key];

                if (typeof aVal === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }
                if (typeof aVal === 'number' || aVal instanceof Date) {
                    return sortConfig.direction === 'ascending' ? aVal - bVal : bVal - aVal;
                }
                return 0;
            });
        }
        return sortedArray;
    }, [currentJobs, sortConfig]);

    
    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
    };

    const toggleSortOptions = () => {
        setShowSortOptions((prev) => !prev);
        setAnimateSortOptions(true);
    };

    const cancelSortOptions = () => {
        setAnimateSortOptions(false);
        setShowSortOptions(false);
    };

    // Add this function to filter jobs based on search term
    const getFilteredJobs = () => {
        return sortedJobs.filter(job => {
            const matchesSearch = job.eventName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
            
            // Time filter logic
            const currentDate = new Date();
            const loadInDate = new Date(job.eventLoadIn);
            const matchesTime = timeFilter === 'all' || 
                (timeFilter === 'future' && loadInDate >= currentDate) ||
                (timeFilter === 'past' && loadInDate < currentDate);

            return matchesSearch && matchesStatus && matchesTime;
        });
    };

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
                Current Jobs
            </h1>

            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                    {/* Search Toggle */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`p-2 rounded-full transition-colors ${
                            showSearch ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
                        } text-white`}
                    >
                        <FaSearch className="text-lg sm:text-xl" />
                    </button>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
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
                                    placeholder="Search by name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 pr-10 py-2 rounded-full bg-white/10 text-white placeholder:text-white/50 outline-none transition-all duration-300 border border-white/20 focus:border-white/40"
                                />
                                <FaSearch className="absolute right-3 text-white/50" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilterPanel && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-3 p-4 bg-neutral-800 rounded-lg">
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                >
                                    <option value="future">Future Events</option>
                                    <option value="all">All Events</option>
                                    <option value="past">Past Events</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="applied">Applied</option>
                                    <option value="approved">Approved</option>
                                    <option value="denied">Denied</option>
                                </select>
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
                                    onClick={() => handleSort('eventName')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Name
                                </button>
                                <button
                                    onClick={() => handleSort('eventLoadIn')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    In Date
                                </button>
                                <button
                                    onClick={() => handleSort('eventLoadOut')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Out Date
                                </button>
                                <button
                                    onClick={() => handleSort('totalHours')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Hours
                                </button>
                                <button
                                    onClick={cancelSortOptions}
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
            <div className="mb-4 text-xs sm:text-sm text-neutral-400">
                Showing {timeFilter === 'future' ? 'upcoming' : timeFilter === 'past' ? 'past' : 'all'} events
                {statusFilter !== 'all' && ` • ${statusFilter} status`}
                {searchTerm && ` • Search: "${searchTerm}"`}
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {isLoading ? (
                    <LoadingSpinner />
                ) : getFilteredJobs().length === 0 ? (
                    <motion.div
                        className="flex flex-col items-center justify-center flex-1 min-h-[300px] sm:min-h-[400px] text-center p-4 sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FaRegSadTear className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                        <h2 className="text-lg sm:text-xl font-semibold text-neutral-300 mb-2">
                            No Events Found
                        </h2>
                        <p className="text-sm sm:text-base text-neutral-400 max-w-md">
                            {searchTerm 
                                ? `No events found matching "${searchTerm}"`
                                : timeFilter === 'future' 
                                    ? "You don't have any upcoming events."
                                    : timeFilter === 'past'
                                        ? "No past events found."
                                        : "No events match your current filters."}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {isGridView ? (
                            <div className="w-full">
                                <HoverEffect 
                                    items={formatJobsForHoverEffect(getFilteredJobs())} 
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg">
                                <table className="min-w-full bg-neutral-800/50">
                                    <thead className="bg-neutral-700">
                                        <tr>
                                            <th className="p-3 sm:p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventName')}>
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Event Name
                                                    <span className="ml-2">{getSortIcon('eventName')}</span>
                                                </div>
                                            </th>
                                            <th className="p-3 sm:p-4 text-left text-white cursor-pointer hidden sm:table-cell" onClick={() => handleSort('eventLoadIn')}>
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Load In
                                                    <span className="ml-2">{getSortIcon('eventLoadIn')}</span>
                                                </div>
                                            </th>
                                            <th className="p-3 sm:p-4 text-left text-white cursor-pointer hidden md:table-cell" onClick={() => handleSort('eventLoadOut')}>
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Load Out
                                                    <span className="ml-2">{getSortIcon('eventLoadOut')}</span>
                                                </div>
                                            </th>
                                            <th className="p-3 sm:p-4 text-left text-white cursor-pointer hidden lg:table-cell" onClick={() => handleSort('totalHours')}>
                                                <div className="flex items-center text-sm sm:text-base">
                                                    Hours
                                                    <span className="ml-2">{getSortIcon('totalHours')}</span>
                                                </div>
                                            </th>
                                            <th className="p-3 sm:p-4 text-left text-white text-sm sm:text-base">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedJobs.map((job) => (
                                            <tr key={job._id} className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors">
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{job.eventName}</span>
                                                        <span className="text-neutral-400 text-xs sm:hidden">
                                                            {new Date(job.eventLoadIn).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden sm:table-cell">
                                                    {new Date(job.eventLoadIn).toLocaleString()}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden md:table-cell">
                                                    {new Date(job.eventLoadOut).toLocaleString()}
                                                </td>
                                                <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden lg:table-cell">
                                                    {job.eventLoadInHours + job.eventLoadOutHours}h
                                                </td>
                                                <td className="p-3 sm:p-4 text-white">
                                                    {getStatusBadge(job.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CurrentJobs;
