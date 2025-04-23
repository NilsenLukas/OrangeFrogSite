// src/components/admin/ViewEvent.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaList, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
// import MultiSelect from './MultiSelect';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// import { HoverBorderGradient } from '../../../ui/hover-border-gradient';

export default function ViewNotifications() {
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
    const [showSearchModal, setShowSearchModal] = useState(false);

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
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/notifications/admin`);
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
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'ascending' 
                ? 'descending' 
                : 'ascending'
        }));
    };

    return (
        <div className="w-full h-full overflow-auto px-4 sm:px-6 md:px-8">
            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-neutral-900 py-4 z-50">
                {/* Left section: Controls */}
                <div className="flex items-center gap-2">
                    {/* Search Toggle */}
                    <button
                        onClick={() => setShowSearchModal(!showSearchModal)}
                        className={`p-2 rounded-full transition-colors ${
                            showSearchModal ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
                        } text-white`}
                    >
                        <FaSearch className="text-lg sm:text-xl" />
                    </button>

                    {/* Sort Toggle */}
                    <button
                        onClick={() => setShowSortOptions(!showSortOptions)}
                        className={`p-2 rounded-full transition-colors ${
                            showSortOptions ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
                        } text-white`}
                    >
                        <FaSort className="text-lg sm:text-xl" />
                    </button>
                </div>

                {/* Right section: View Toggle */}
                <div className="flex gap-2">
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

            {/* Control Panels */}
            <div className="mb-4">
                {/* Search Panel */}
                <AnimatePresence>
                    {showSearchModal && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search by keyword"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                    className="w-full px-4 pr-10 py-2 rounded-full bg-white/10 text-white placeholder:text-white/50 outline-none transition-all duration-300 border border-white/20 focus:border-white/40"
                                />
                                <FaSearch className="absolute right-3 text-white/50" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sort Options Panel */}
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
            </div>

            {/* Filter Summary */}
            {nameFilter && (
                <div className="mb-4 text-xs sm:text-sm text-neutral-400">
                    Search: "{nameFilter}"
                </div>
            )}

            {/* Content Area */}
            <div className="relative z-0 pb-8">
                {getFilteredAndSortedNotifications().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-4xl sm:text-6xl mb-4">📝</span>
                        <p className="text-lg sm:text-xl">No notifications found</p>
                        <p className="text-xs sm:text-sm mt-2">Try adjusting your filters or create a new notification</p>
                    </div>
                ) : (
                    view === 'grid' ? (
                        <div className="max-w-full mx-auto">
                            <HoverEffect 
                                items={formatEventsForHoverEffect(getFilteredAndSortedNotifications())} 
                                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto"
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                            <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden text-xs sm:text-sm">
                                <thead className="bg-neutral-700">
                                    <tr>
                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-24 sm:w-auto"
                                            onClick={() => handleSort('text0')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Description</span>
                                                <span className="ml-1">{getSortIcon('text0')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('subject')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Subject</span>
                                                <span className="ml-1">{getSortIcon('subject')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('createdAt')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Created</span>
                                                <span className="ml-1">{getSortIcon('createdAt')}</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredAndSortedNotifications().map((notification) => (
                                        <tr 
                                            key={notification._id} 
                                            className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                        >
                                            <td className="p-1 sm:p-2 text-white truncate w-24 sm:w-auto">
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
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {notification.subject}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}