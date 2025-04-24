import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSortUp, FaSortDown, FaSearch, FaArrowLeft, FaFilter } from 'react-icons/fa';
import { AuthContext } from "../../../../AuthContext";
import { Link } from "react-router-dom";
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { AnimatePresence, motion } from 'framer-motion';

export default function FindJobs() {
    const { auth } = useContext(AuthContext);
    const [isGridView, setIsGridView] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [jobStatuses, setJobStatuses] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmationType, setConfirmationType] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [nameFilter, setNameFilter] = useState("");
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [timeFilter, setTimeFilter] = useState('future');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchAssignedJobs = async () => {
            try {
                console.log("Fetching jobs for user:", auth.email);
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}/events/assigned/${auth.email}`
                );
                console.log("Jobs response:", response.data);
                
                const currentDate = new Date();
                const futureJobs = response.data.filter(job => {
                    const loadInDate = new Date(job.eventLoadIn);
                    return loadInDate >= currentDate;
                });

                setJobs(futureJobs);

                const statuses = {};
                futureJobs.forEach((job) => {
                    if (job.acceptedContractors.includes(auth.email)) {
                        statuses[job._id] = "Accepted";
                    } else if (job.rejectedContractors.includes(auth.email)) {
                        statuses[job._id] = "Rejected";
                    } else {
                        statuses[job._id] = "";
                    }
                });
                setJobStatuses(statuses);
            } catch (error) {
                console.error("Error fetching assigned jobs:", error);
                toast.error("Failed to fetch available jobs");
            }
        };

        if (auth.email) {
            fetchAssignedJobs();
        }
    }, [auth.email]);

    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            return { key, direction };
        });
    };

    const toggleSortOptions = () => {
        setShowSortOptions((prev) => !prev);
        setShowFilterPanel(false);
        setShowSearch(false);
    };

    const toggleSearch = () => {
        setShowSearch((prev) => !prev);
        setShowFilterPanel(false);
        setShowSortOptions(false);
    };

    const toggleFilterPanel = () => {
        setShowFilterPanel((prev) => !prev);
        setShowSearch(false);
        setShowSortOptions(false);
    };

    const sortedJobs = React.useMemo(() => {
        let sortedArray = [...jobs];
        if (sortConfig.key) {
            sortedArray.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

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
    }, [jobs, sortConfig]);

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
    };

    const handleReject = async (id) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND}/events/reject`, {
                eventId: id,
                email: auth.email,
            });
            setJobStatuses((prev) => ({ ...prev, [id]: "Rejected" }));
            setJobs((prevJobs) => prevJobs.filter((job) => job._id !== id));
        } catch (error) {
            console.error("Error rejecting job:", error);
        }
    };

    const handleApply = async (eventId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/events/${eventId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractorId: auth._id,
                    email: auth.email
                }),
            });

            if (response.ok) {
                setJobs(prevJobs => prevJobs.filter(job => job._id !== eventId));
                toast.success('Successfully applied to event');
            } else {
                toast.error('Failed to apply to event');
            }
        } catch (error) {
            console.error('Error applying to event:', error);
            toast.error('Error applying to event');
        }
    };

    const openConfirmModal = (type, jobId) => {
        setConfirmationType(type);
        setSelectedJobId(jobId);
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        if (confirmationType === 'apply') {
            await handleApply(selectedJobId);
        } else if (confirmationType === 'reject') {
            await handleReject(selectedJobId);
        }
        setShowConfirmModal(false);
    };

    const formatJobsForHoverEffect = (jobs) => {
      return jobs.map((job) => ({
          title: (
              <div>
                  <span className="text-lg font-semibold">
                      {job.eventName.length > 25
                          ? `${job.eventName.substring(0, 25)}...`
                          : job.eventName}
                  </span>
              </div>
          ),
          description: (
              <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      {/* Load In Section */}
                      <div className="space-y-2">
                          <p className="text-neutral-400 font-medium">Load In:</p>
                          <div className="pl-2 border-l-2 border-neutral-700">
                              <p className="text-white">
                                  {new Date(job.eventLoadIn).toLocaleString()}
                              </p>
                              <p className="text-neutral-300">
                                  Hours: {job.eventLoadInHours}h
                              </p>
                          </div>
                      </div>
  
                      {/* Load Out Section */}
                      <div className="space-y-2">
                          <p className="text-neutral-400 font-medium">Load Out:</p>
                          <div className="pl-2 border-l-2 border-neutral-700">
                              <p className="text-white">
                                  {new Date(job.eventLoadOut).toLocaleString()}
                              </p>
                              <p className="text-neutral-300">
                                  Hours: {job.eventLoadOutHours}h
                              </p>
                          </div>
                      </div>
                  </div>
  
                  {/* Location Section */}
                  <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                          <span className="text-zinc-400">Location:</span>
                          <span>
                              {job.eventLocation.length > 25
                                  ? `${job.eventLocation.substring(0, 25)}...`
                                  : job.eventLocation}
                          </span>
                      </div>
                      {/* <div className="space-y-2">
                          <p className="text-neutral-400 font-medium">Location</p>
                          <p className="text-white">{job.eventLocation}</p>
                      </div> */}
                  </div>
  
                  {/* Description Section */}
                  <div className="space-y-2">
                      <p className="text-neutral-400 font-medium">Description:</p>
                      <p className="text-white line-clamp-3">{job.eventDescription}</p>
                  </div>
  
                  {/* Action Buttons */}
                  <div className="flex justify-center mt-4 space-x-3">
                      {jobStatuses[job._id] === "" ? (
                          <>
                              <button
                                  onClick={(e) => {
                                      e.preventDefault();
                                      openConfirmModal('apply', job._id);
                                  }}
                                  className="text-green-500 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-md transition-colors font-semibold whitespace-nowrap"
                              >
                                  ✔ Apply
                              </button>
                              <button
                                  onClick={(e) => {
                                      e.preventDefault();
                                      openConfirmModal('reject', job._id);
                                  }}
                                  className="text-red-500 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-md transition-colors font-semibold whitespace-nowrap"
                              >
                                  ✖ Reject
                              </button>
                          </>
                      ) : (
                          <span
                              className={`font-semibold ${
                                  jobStatuses[job._id] === "Accepted"
                                      ? "text-green-600"
                                      : "text-red-600"
                              }`}
                          >
                              {jobStatuses[job._id] === "Accepted"
                                  ? "✔ Applied"
                                  : "✖ Rejected"}
                          </span>
                      )}
                  </div>
              </div>
          ),
          link: "#",
      }));
  };
  

  const getFilteredJobs = () => {
    return sortedJobs.filter(job => {
        const matchesName = job.eventName.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesTime = timeFilter === 'all' || 
            (timeFilter === 'future' && new Date(job.eventLoadIn) >= new Date()) ||
            (timeFilter === 'past' && new Date(job.eventLoadIn) < new Date());
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'applied' && jobStatuses[job._id] === "Accepted") ||
            (statusFilter === 'approved' && job.status === 'approved') ||
            (statusFilter === 'denied' && job.status === 'denied');
        
        return matchesName && matchesTime && matchesStatus;
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen h-full p-4 sm:p-6 md:p-8 bg-gray-100 dark:bg-neutral-900">
        <Link
            to="/user/dashboard"
            className="mb-4 sm:mb-6 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
        >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
        </Link>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 md:mb-8 text-center">
            Available Jobs
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
        <div className="mb-4 text-xs sm:text-sm text-neutral-400">
            Showing {timeFilter === 'future' ? 'upcoming' : timeFilter === 'past' ? 'past' : 'all'} events
            {statusFilter !== 'all' && ` • ${statusFilter} status`}
            {nameFilter && ` • Search: "${nameFilter}"`}
        </div>

        {/* Content Area */}
        <div className="flex-1">
            <AnimatePresence>
                {getFilteredJobs().length > 0 ? (
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
                                            <th className="p-3 sm:p-4 text-left text-white text-sm sm:text-base">Actions</th>
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
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        {jobStatuses[job._id] === "" ? (
                                                            <>
                                                                <button
                                                                    onClick={() => openConfirmModal('apply', job._id)}
                                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors text-sm sm:text-base"
                                                                >
                                                                    Apply
                                                                </button>
                                                                <button
                                                                    onClick={() => openConfirmModal('reject', job._id)}
                                                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors text-sm sm:text-base"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span
                                                                className={`px-3 py-1.5 rounded-full text-sm sm:text-base ${
                                                                    jobStatuses[job._id] === "Accepted"
                                                                        ? "bg-green-500/20 text-green-400"
                                                                        : "bg-red-500/20 text-red-400"
                                                                }`}
                                                            >
                                                                {jobStatuses[job._id]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        className="flex flex-col items-center justify-center flex-1 min-h-[300px] sm:min-h-[400px] text-center p-4 sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FaRegSadTear className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                        <h2 className="text-lg sm:text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            No Available Jobs
                        </h2>
                        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md">
                            {nameFilter 
                                ? `No jobs found matching "${nameFilter}"`
                                : timeFilter === 'future' 
                                    ? "No upcoming jobs available at the moment."
                                    : timeFilter === 'past'
                                        ? "No past jobs found."
                                        : "No jobs match your current filters."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {showConfirmModal && (
            <Modal>
                <div className="bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="p-4 sm:p-6 border-b border-neutral-700">
                        <h3 className="text-lg sm:text-xl font-semibold text-white">
                            {confirmationType === "apply"
                                ? "Confirm Application"
                                : "Confirm Rejection"}
                        </h3>
                    </div>

                    <div className="p-4 sm:p-6">
                        <p className="text-sm sm:text-base text-neutral-300 mb-6">
                            {confirmationType === "apply"
                                ? "Are you sure you want to apply?"
                                : "Are you sure you want to reject this event?"}
                        </p>

                        <div className="flex justify-end space-x-3 sm:space-x-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded-full transition-colors text-sm sm:text-base ${
                                    confirmationType === "apply"
                                        ? "bg-green-500 hover:bg-green-600 text-white"
                                        : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                            >
                                {confirmationType === "apply" ? "Apply" : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  

);}
