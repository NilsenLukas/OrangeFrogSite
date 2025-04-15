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
        <div className="w-full h-full overflow-auto px-5">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-neutral-900 py-4 z-50">
                <div className="flex items-center gap-4">
                    <div className='flex items-center gap-3 mt-3'>
                        {/* Name filter input */}
                        <div className="relative flex items-center mt-3">
                            <input
                                type="text"
                                placeholder="Search by name"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-40 md:w-54 lg:w-64 px-4 pr-10 rounded-full bg-white/10 text-white placeholder:text-white/50 outline-none transition-all duration-300 overflow-hidden border border-white/20 focus:border-white/40"
                                style={{
                                    transition: 'width 0.3s ease',
                                    height: '2.5rem', 
                                }}
                            />
                            <FaSearch className="absolute right-3 text-white/50" />
                        </div>

                        {/* Sort dropdown */}
                        <div className="flex items-center gap-3 mt-2">
                            <AnimatePresence>
                                {!showSortOptions && (
                                    <motion.button
                                        initial={{ opacity: 0, x: -20 }}      
                                        animate={{ opacity: 1, x: 0 }}         
                                        exit={{ opacity: 0, x: -20 }}         
                                        transition={{ duration: 0.3 }}
                                        onClick={() => setShowSortOptions(true)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors mt-0 ${
                                            showSortOptions
                                                ? 'bg-neutral-700 text-white'
                                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                        }`}
                                    >
                                        <FaSort className="text-xl" />
                                        <span className="whitespace-nowrap">Filter by</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {showSortOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}        // Start hidden & to the right
                                        animate={{ opacity: 1, x: 0 }}          // Fade in from the right
                                        exit={{ opacity: 0, x: 20 }}            // Fade out to the right when hidden
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-white whitespace-nowrap">Sort by:</span>

                                        <button
                                            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors mt-0"
                                            onClick={() => handleSort('text0')}
                                        >
                                            Description
                                        </button>

                                        <button
                                            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors mt-0 whitespace-nowrap"
                                            onClick={() => handleSort('createdAt')}
                                        >
                                            Creation Date
                                        </button>

                                        <motion.button
                                            initial={{ opacity: 0, x: -20 }}    // Fade in from the left
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}       // Fade out to the left when hiding
                                            transition={{ delay: 0.2 }}
                                            type="button"
                                            onClick={() => setShowSortOptions(false)}
                                            className="h-9 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors mt-0"
                                        >
                                            Cancel
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative">

                    <div className="hidden md:flex gap-2 mt-5">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2 mt-0 rounded transition-colors ${
                                view === 'grid' 
                                    ? 'bg-neutral-700 text-white' 
                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                            }`}
                        >
                            <FaTh className="text-xl" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 mt-0 rounded transition-colors ${
                                view === 'list' 
                                    ? 'bg-neutral-700 text-white' 
                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                            }`}
                        >
                            <FaList className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            

            <div className="relative z-0 pb-8">
                {getFilteredAndSortedNotifications().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-6xl mb-4">😢</span>
                        <p className="text-xl">No notifications found</p>
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
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('subject')}
                                    >
                                        <div className="flex items-center">
                                            Subject
                                            <span className="ml-2">{getSortIcon('subject')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
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
                                            className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                        >
                                            <td className="p-4 text-white">
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
                                            <td className="p-4 text-white">
                                                {notification.subject}
                                            </td>
                                            <td className="p-4 text-white">
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