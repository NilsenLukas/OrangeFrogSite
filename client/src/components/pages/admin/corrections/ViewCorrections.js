// Admin View/Manage Correction Reports Page
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaList, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ViewCorrections() {
    const navigate = useNavigate();
    const [corrections, setCorrections] = useState([]);
    const [events, setEvents] = useState(null);
    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [correctionToDelete] = useState(null);
    const [nameFilter, setNameFilter] = useState('');
    const selectRef = useRef(null);
    const [setShowFilterDropdown] = useState(false);
    const filterDropdownRef = useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        fetchCorrections();
    }, []);

    useEffect(() => {
        const handleClickOutside = (correction) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(correction.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCorrections = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections`);
            console.log(response.data); // Debug: Check what is actually returned
    
            // Ensure we're sorting the corrections array inside the response object
            const sortedCorrections = response.data.corrections.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setCorrections(sortedCorrections);
            setUsers(response.data.users);
            setEvents(response.data.events);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching corrections:', error);
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND}/corrections/${correctionToDelete._id}`);
            setCorrections(corrections.filter(e => e._id !== correctionToDelete._id));
            setShowDeletePopup(false);
            toast.success('Correction deleted successfully!');
        } catch (error) {
            console.error('Error deleting correction:', error);
            toast.error('Failed to delete correction');
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

    const getFilteredAndSortedCorrections = () => {
        let filtered = corrections.filter(correction => {
            return !nameFilter || correction.correctionName.toLowerCase().includes(nameFilter.toLowerCase());
        });
    
        if (sortConfig.key) {
            filtered.sort((a, b) => {
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
        return filtered;
    };

    if (loading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <p className="text-white">Loading corrections...</p>
            </div>
        );
    }

    const handleEventClick = (correctionId) => {
        navigate(`/admin/corrections/${correctionId}`);
    };

    const formatEventsForHoverEffect = (corrections) => {
        return corrections.map((correction) => {
            // Ensure events and correction.eventID exist before accessing properties
            const event = events?.find(e => e._id === correction.eventID);
            const user = users?.find(e => e._id === correction.userID);
    
            return {
                title: (
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                            {correction.correctionName}
                        </span>
                    </div>
                ),
                description: (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Status:</span>
                            <span className="ml-2 text-white">{correction.status}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Created By:</span>
                            <span className="ml-2 text-white">{user ? user.name : 'Unknown User'}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Event:</span>
                            <span className="ml-2 text-white">{event ? event.eventName : 'Unknown Event'}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Correction Type:</span>
                            <span className="ml-2 text-white">{correction.requestType}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Created:</span>
                            <span className="ml-2 text-white">{new Date(correction.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Last Modified:</span>
                            <span className="ml-2 text-white">{new Date(correction.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                ),
                link: `/admin/corrections/${correction._id}`,
                _id: correction._id,
                onClick: (e) => {
                    if (!e.defaultPrevented) {
                        handleEventClick(correction._id);
                    }
                }
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
                                    onClick={() => handleSort('correctionName')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Name
                                </button>
                                <button
                                    onClick={() => handleSort('requestType')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Type
                                </button>
                                <button
                                    onClick={() => handleSort('status')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Status
                                </button>
                                <button
                                    onClick={() => handleSort('submittedAt')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Creation Date
                                </button>
                                <button
                                    onClick={() => handleSort('updatedAt')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Last Modified
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
                {getFilteredAndSortedCorrections().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-4xl sm:text-6xl mb-4">😢</span>
                        <p className="text-lg sm:text-xl">No corrections found</p>
                        <p className="text-xs sm:text-sm mt-2">Try adjusting your filters or create a new correction</p>
                    </div>
                ) : (
                    view === 'grid' ? (
                        <div className="max-w-full mx-auto">
                            <HoverEffect 
                                items={formatEventsForHoverEffect(getFilteredAndSortedCorrections())} 
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
                                            onClick={() => handleSort('correctionName')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Name</span>
                                                <span className="ml-1">{getSortIcon('correctionName')}</span>
                                            </div>
                                        </th>

                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-16 sm:w-auto"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Status</span>
                                                <span className="ml-1">{getSortIcon('status')}</span>
                                            </div>
                                        </th>

                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('userID')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Created By</span>
                                                <span className="ml-1">{getSortIcon('userID')}</span>
                                            </div>
                                        </th>

                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('eventID')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Event</span>
                                                <span className="ml-1">{getSortIcon('eventID')}</span>
                                            </div>
                                        </th>

                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-16 sm:w-auto"
                                            onClick={() => handleSort('requestType')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Type</span>
                                                <span className="ml-1">{getSortIcon('requestType')}</span>
                                            </div>
                                        </th>

                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('submittedAt')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Created</span>
                                                <span className="ml-1">{getSortIcon('submittedAt')}</span>
                                            </div>
                                        </th>
                                        <th 
                                            className="p-1 sm:p-2 text-left text-white cursor-pointer whitespace-nowrap w-20 sm:w-auto"
                                            onClick={() => handleSort('updatedAt')}
                                        >
                                            <div className="flex items-center">
                                                <span className="truncate">Modified</span>
                                                <span className="ml-1">{getSortIcon('updatedAt')}</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredAndSortedCorrections().map((correction) => (
                                        <tr 
                                            key={correction._id} 
                                            className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                            onClick={() => handleEventClick(correction._id)}
                                        >
                                            <td className="p-1 sm:p-2 text-white truncate w-24 sm:w-auto">
                                                {correction.correctionName}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-16 sm:w-auto">
                                                {correction.status}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {users?.find(user => user._id === correction.userID)?.name}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {events?.find(event => event._id === correction.eventID)?.eventName}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-16 sm:w-auto">
                                                {correction.requestType}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {new Date(correction.submittedAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-1 sm:p-2 text-white truncate w-20 sm:w-auto">
                                                {new Date(correction.updatedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Delete Confirmation Popup */}
            {showDeletePopup && (
                <Modal>
                    <div className="bg-neutral-900 p-4 sm:p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                        <h2 className="text-red-500 text-xl sm:text-2xl mb-4">Are you sure you want to delete this Correction?</h2>
                        <p className="text-neutral-300 mb-6 text-sm sm:text-base">
                            This action cannot be undone. Once deleted, this correction's data will be permanently removed from the system.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setShowDeletePopup(false)} 
                                className="px-3 sm:px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-3 sm:px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors text-sm sm:text-base"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}