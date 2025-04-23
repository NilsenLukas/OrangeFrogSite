import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { FaList, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch, FaArrowLeft, FaFilter, FaRegSadTear } from 'react-icons/fa';
// import MultiSelect from './MultiSelect';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from "../../../../AuthContext";
// import { HoverBorderGradient } from '../../../ui/hover-border-gradient';

export default function ViewNotifications() {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    // const [contractors, setContractors] = useState([]);
    // const [selectedContractors, setSelectedContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [setSaving] = useState(false);
    const [view, setView] = useState('grid');
    const [nameFilter, setNameFilter] = useState('');
    const selectRef = useRef(null);
    // const [sortField, setSortField] = useState(null);
    // const [sortDirection, setSortDirection] = useState('asc');
    const [setShowFilterDropdown] = useState(false);
    // const [setFilterField] = useState(null);
    // const [setFilterValues] = useState({ name: '', location: '', startDate: '', endDate: '', contractor: [] });
    const filterDropdownRef = useRef(null);
    // const [selectedEvent] = useState(null);
    // const [selectedContractor, setSelectedContractor] = useState([]);
    // const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClickOutside = (notification) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(notification.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/notifications/${auth.email}`);
            console.log(response.data); // Debug: Check what is actually returned
    
            // Ensure we're sorting the notifications array inside the response object
            const sortedNotifications = response.data.notifications.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setNotifications(sortedNotifications);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    const adjustSelectWidth = () => {
        const selectElement = selectRef.current;
        if (selectElement) {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const width = selectedOption.text.length * 8 + 78; 
            selectElement.style.width = `${width}px`;
        }
    };

    useEffect(() => {
        adjustSelectWidth(); // Set initial width
    }, []);

    const getFilteredAndSortedNotifications = () => {
        // Return empty array if data is not loaded yet
        if (!notifications) return [];

        // Filter notifications by search text across multiple fields
        const filteredNotifications = notifications.filter(notification => {
            // Return true if no filter is applied
            if (!nameFilter || nameFilter.trim() === '') return true;
            
            const searchTerm = nameFilter.toLowerCase().trim();
            
            // Create search fields with proper null checks
            const searchFields = [
                notification.text0 || '',
                notification.text1 || '',
                notification.text2 || '',
                notification.linkText1 || '',
                notification.linkText2 || '',
                notification.subject || '',
                notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''
            ].filter(Boolean); // Remove any empty strings

            // Only search if we have valid fields to search through
            return searchFields.length > 0 && searchFields.some(field => 
                field.toLowerCase().includes(searchTerm)
            );
        });

        if (sortConfig.key) {
            filteredNotifications.sort((a, b) => {
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
        return filteredNotifications;
    };

    if (loading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <p className="text-white">Loading notifications...</p>
            </div>
        );
    }

    const formatEventsForHoverEffect = (notifications) => {
        return notifications.map((notification) => {
    
            return {
                title: (
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                            {notification.text0}
                            <Link 
                                to={`${notification.linkPath1}`}
                                className="hover:text-blue-500 transition-colors group"
                            >
                                <u>{notification.linkText1}</u>
                            </Link>
                            {notification.text1}
                            <Link 
                                to={`${notification.linkPath2}`}
                                className="hover:text-blue-500 transition-colors group"
                            >
                                <u>{notification.linkText2}</u>
                            </Link>
                            {notification.text2}
                        </span>
                    </div>
                ),
                description: (
                    <div className="space-y-4">
                        <div className="space-y-2 space-x-2">
                            <span className="text-neutral-400 font-medium">Subject:</span>
                            <span className="ml-2 text-white">{notification.subject}</span>
                        </div>
                        <div className="space-y-2 space-x-2">
                            <span className="text-neutral-400 font-medium">Created:</span>
                            <span className="ml-2 text-white">{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                ),
                _id: notification._id,
            };
        });
    };
    

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
    };

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
                Notifications
            </h1>

            {/* Control Bar */}
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-neutral-900 py-4 z-50">
                <div className="flex items-center gap-4">
                    <div className='flex items-center gap-3'>
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
                            transition={{ duration: 0.3 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search notifications"
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
                            transition={{ duration: 0.3 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 p-4 bg-neutral-800 rounded-lg">
                                <button
                                    onClick={() => handleSort('text0')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Description
                                </button>
                                <button
                                    onClick={() => handleSort('subject')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Subject
                                </button>
                                <button
                                    onClick={() => handleSort('createdAt')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Creation Date
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

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilterPanel && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-3 p-4 bg-neutral-800 rounded-lg">
                                <select
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                >
                                    <option value="all">All Types</option>
                                    <option value="event">Event</option>
                                    <option value="system">System</option>
                                </select>
                                <button
                                    onClick={() => setShowFilterPanel(false)}
                                    className="px-3 sm:px-4 py-2 bg-neutral-600 text-white rounded-full hover:bg-neutral-500 transition-colors text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <AnimatePresence>
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-white">Loading notifications...</p>
                        </div>
                    ) : getFilteredAndSortedNotifications().length === 0 ? (
                        <motion.div
                            className="flex flex-col items-center justify-center flex-1 min-h-[300px] sm:min-h-[400px] text-center p-4 sm:p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FaRegSadTear className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
                            <h2 className="text-lg sm:text-xl font-semibold text-neutral-300 mb-2">
                                No notifications found
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-400 max-w-md">
                                {nameFilter 
                                    ? `No notifications found matching "${nameFilter}"`
                                    : "No notifications available at the moment."}
                            </p>
                        </motion.div>
                    ) : (
                        view === 'grid' ? (
                            <div className="w-full">
                                <HoverEffect 
                                    items={formatEventsForHoverEffect(getFilteredAndSortedNotifications())} 
                                    className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto"
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
                                    <thead className="bg-neutral-700">
                                        <tr>
                                            <th 
                                                className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                                onClick={() => handleSort('text0')}
                                            >
                                                <div className="flex items-center">
                                                    Description
                                                    <span className="ml-2">{getSortIcon('text0')}</span>
                                                </div>
                                            </th>
                                            <th 
                                                className="p-4 text-left text-white cursor-pointer whitespace-nowrap hidden sm:table-cell"
                                                onClick={() => handleSort('subject')}
                                            >
                                                <div className="flex items-center">
                                                    Subject
                                                    <span className="ml-2">{getSortIcon('subject')}</span>
                                                </div>
                                            </th>
                                            <th 
                                                className="p-4 text-left text-white cursor-pointer whitespace-nowrap hidden md:table-cell"
                                                onClick={() => handleSort('createdAt')}
                                            >
                                                <div className="flex items-center">
                                                    Created
                                                    <span className="ml-2">{getSortIcon('createdAt')}</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredAndSortedNotifications().map((notification) => (
                                            <tr 
                                                key={notification._id} 
                                                className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors"
                                            >
                                                <td className="p-4 text-white">
                                                    <div className="flex flex-col">
                                                        <div>
                                                            {notification.text0}
                                                            <Link 
                                                                to={`${notification.linkPath1}`}
                                                                className="hover:text-blue-500 transition-colors group"
                                                            >
                                                                <u>{notification.linkText1}</u>
                                                            </Link>
                                                            {notification.text1}
                                                            <Link 
                                                                to={`${notification.linkPath2}`}
                                                                className="hover:text-blue-500 transition-colors group"
                                                            >
                                                                <u>{notification.linkText2}</u>
                                                            </Link>
                                                            {notification.text2}
                                                        </div>
                                                        <span className="text-neutral-400 text-xs sm:hidden mt-1">
                                                            {new Date(notification.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-white hidden sm:table-cell">
                                                    {notification.subject}
                                                </td>
                                                <td className="p-4 text-white hidden md:table-cell">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}