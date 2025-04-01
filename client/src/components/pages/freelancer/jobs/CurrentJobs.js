import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../../AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSearch, FaFilter, FaSortUp, FaSortDown } from 'react-icons/fa';
import { HoverEffect } from "../../../ui/card-hover-effect";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
        <motion.div
            className="w-16 h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-neutral-400">Loading jobs...</p>
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
    const navigate = useNavigate();

    // const fetchJobs = async () => {
    //     try {
    //         setIsLoading(true);
    //         const response = await fetch(`${process.env.REACT_APP_BACKEND}/events/contractor/${auth.email}`);
    //         if (response.ok) {
    //             const data = await response.json();
                
    //             // Filter jobs based on status and dates
    //             const currentDate = new Date();
    //             const filteredJobs = data.filter(job => {
    //                 const loadInDate = new Date(job.eventLoadIn);
    //                 const deniedDate = job.deniedAt ? new Date(job.deniedAt) : null;

    //                 if (job.status === 'approved') {
    //                     return true;
    //                 }
    //                 else if (job.status === 'applied') {
    //                     return currentDate < loadInDate;
    //                 }
    //                 else if (job.status === 'denied' && deniedDate) {
    //                     const hoursSinceDenied = (currentDate - deniedDate) / (1000 * 60 * 60);
    //                     return hoursSinceDenied < 24;
    //                 }
    //                 return false;
    //             });

    //             setCurrentJobs(filteredJobs);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching jobs:", error);
    //         toast.error("Error fetching jobs");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        if (auth.email) {
            const fetchJobs = async () => {
                try {
                    setIsLoading(true);
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
        <div className="flex flex-col w-full min-h-screen h-full p-8 bg-neutral-900">
            <Link 
                to="/user/dashboard"
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
                Current Jobs
            </h1>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative mt-5">
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 bg-neutral-800 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
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
                                        ? 'bg-neutral-700 text-white'
                                        : 'bg-neutral-800 text-white hover:bg-neutral-700'
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

                                <button
                                    className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                                    rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                                    onClick={() => handleSort('eventName')}
                                >
                                    Name
                                </button>

                                <button
                                    className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                                    rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                                    onClick={() => handleSort('eventLoadIn')}
                                >
                                    In Date
                                </button>

                                <button
                                    className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                                    rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                                    onClick={() => handleSort('eventLoadOut')}
                                >
                                    Out Date
                                </button>

                                <button
                                    className="inline-flex items-center justify-center px-6 py-2 bg-neutral-800 text-white 
                                    rounded hover:bg-neutral-700 transition-colors mt-0 text-sm whitespace-nowrap"
                                    onClick={() => handleSort('totalHours')}
                                >
                                    Total Hours
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
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => setIsGridView(true)}
                        className={`p-2 mt-0 rounded transition-colors ${
                            isGridView ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                        title="Grid View"
                    >
                        <FaTh className="text-xl" />
                    </button>
                    <button
                        onClick={() => setIsGridView(false)}
                        className={`p-2 mt-0 rounded transition-colors ${
                            !isGridView ? 'bg-neutral-700 text-white' : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                        title="List View"
                    >
                        <FaList className="text-xl" />
                    </button>
                </div>
            </div>

            {showFilters && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6 p-4 bg-neutral-800 rounded-lg"
                >
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="px-4 py-2 bg-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="future">Future Events</option>
                            <option value="all">All Events</option>
                            <option value="past">Past Events</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="applied">Applied</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>
                    </div>
                </motion.div>
            )}

            <div className="mb-4 text-sm text-neutral-400">
                Showing {timeFilter === 'future' ? 'upcoming' : timeFilter === 'past' ? 'past' : 'all'} events
                {statusFilter !== 'all' && ` • ${statusFilter} status`}
                {searchTerm && ` • Search: "${searchTerm}"`}
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : getFilteredJobs().length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] text-center">
                    <FaRegSadTear className="w-16 h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        No Events Found
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        {searchTerm 
                            ? `No events found matching "${searchTerm}"`
                            : timeFilter === 'future' 
                                ? "You don't have any upcoming events."
                                : timeFilter === 'past'
                                    ? "No past events found."
                                    : "No events match your current filters."}
                    </p>
                    {timeFilter !== 'future' && (
                        <button 
                            onClick={() => setTimeFilter('future')}
                            className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg text-white hover:bg-neutral-700 transition-colors"
                        >
                            Show Future Events
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {isGridView ? (
                        <div className="w-full">
                            <HoverEffect 
                                items={formatJobsForHoverEffect(getFilteredJobs())} 
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
                                <thead className="bg-neutral-700">
                                    <tr>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventName')}>
                                            <div className="flex items-center">
                                                Event Name
                                                <span className="ml-2">{getSortIcon('eventName')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventLoadIn')}>
                                            <div className="flex items-center">
                                                Load In Date
                                                <span className="ml-2">{getSortIcon('eventLoadIn')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventLoadInHours')}>
                                            <div className="flex items-center">
                                                Load In Hours
                                                <span className="ml-2">{getSortIcon('eventLoadInHours')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventLoadOut')}>
                                            <div className="flex items-center">
                                                Load Out Date
                                                <span className="ml-2">{getSortIcon('eventLoadOut')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('eventLoadOutHours')}>
                                            <div className="flex items-center">
                                                Load Out Hours
                                                <span className="ml-2">{getSortIcon('eventLoadOutHours')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('totalHours')}>
                                            <div className="flex items-center">
                                                Total Hours
                                                <span className="ml-2">{getSortIcon('totalHours')}</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-white cursor-pointer" onClick={() => handleSort('status')}>
                                            <div className="flex items-center">
                                                Status
                                                <span className="ml-2">{getSortIcon('status')}</span>
                                            </div>
                                        </th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredJobs().map((job) => (
                                        <tr key={job._id} className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer">
                                            <td className="p-4 text-white">{job.eventName}</td>
                                            <td className="p-4 text-white">{new Date(job.eventLoadIn).toLocaleString()}</td>
                                            <td className="p-4 text-white">{job.eventLoadInHours}</td>
                                            <td className="p-4 text-white">{new Date(job.eventLoadOut).toLocaleString()}</td>
                                            <td className="p-4 text-white">{job.eventLoadOutHours}</td>
                                            <td className="p-4 text-white">{job.eventLoadInHours + job.eventLoadOutHours}</td>
                                            <td className="p-4 text-white">{getStatusBadge(job.status)}</td>
                                            
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CurrentJobs;
