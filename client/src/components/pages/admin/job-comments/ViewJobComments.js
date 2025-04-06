// src/components/admin/ViewEvent.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaList, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
// import MultiSelect from './MultiSelect';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// import { HoverBorderGradient } from '../../../ui/hover-border-gradient';

export default function ViewJobComments() {
    const navigate = useNavigate();
    const [jobComments, setJobComments] = useState([]);
    const [events, setEvents] = useState(null);
    const [users, setUsers] = useState(null);
    // const [contractors, setContractors] = useState([]);
    // const [selectedContractors, setSelectedContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [setSaving] = useState(false);
    const [view, setView] = useState('grid');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [jobCommentToDelete] = useState(null);
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
        fetchJobComments();
    }, []);

    useEffect(() => {
        const handleClickOutside = (jobComment) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(jobComment.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchJobComments = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/job-comments`);
            console.log(response.data); // Debug: Check what is actually returned
    
            // Ensure we're sorting the Job Comment array inside the response object
            const sortedJobComments = response.data.jobComments.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setJobComments(sortedJobComments);
            setUsers(response.data.users);
            setEvents(response.data.events);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching job comments:', error);
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND}/job-comments/${jobCommentToDelete._id}`);
            setJobComments(jobComments.filter(e => e._id !== jobCommentToDelete._id));
            setShowDeletePopup(false);
            toast.success('Job comment deleted successfully!');
        } catch (error) {
            console.error('Error deleting job comment:', error);
            toast.error('Failed to delete job comment');
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

    // const handleFilterFieldChange = (field) => {
    //     setFilterField(field);
    // };

    // const handleFilterChange = (e) => {
    //     const { name, value } = e.target;
    //     setFilterValues((prev) => ({ ...prev, [name]: value }));
    // };

    const getFilteredAndSortedJobComments = () => {
        let filtered = jobComments.filter(jobComment => {
            return !nameFilter || jobComment.userID.toLowerCase().includes(nameFilter.toLowerCase());
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
                <p className="text-white">Loading job comments...</p>
            </div>
        );
    }

    const handleEventClick = (jobCommentId) => {
        navigate(`/admin/job-comments/${jobCommentId}`);
    };

    const formatEventsForHoverEffect = (jobComments) => {
        return jobComments.map((jobComment) => {
            // Ensure events and jobComment.eventID exist before accessing properties
            const event = events?.find(e => e._id === jobComment.eventID);
            const user = users?.find(e => e._id === jobComment.userID);
    
            return {
                title: (
                    <div className="flex gap-2 items-center text-lg ">
                        <span className="text-neutral-400">User:</span>
                        <span className="font-semibold flex start">
                            {user.name}
                        </span>
                    </div>
                ),
                description: (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Event:</span>
                            <span className="ml-2 text-white">{event.eventName}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Created:</span>
                            <span className="ml-2 text-white">{new Date(jobComment.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Last Modified:</span>
                            <span className="ml-2 text-white">{new Date(jobComment.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                ),
                link: `/admin/job-comments/${jobComment._id}`,
                _id: jobComment._id,
                onClick: (e) => {
                    if (!e.defaultPrevented) {
                        handleEventClick(jobComment._id);
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
        <div className="w-full h-full overflow-auto px-5">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-neutral-900 py-4 z-50">
                <div className="flex items-center gap-4">
                    <div className='flex items-center gap-3 mt-3'>
                        {/* Name filter input */}
                        <div className="relative flex items-center mt-2">
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
                                            onClick={() => handleSort('correctionName')}
                                        >
                                            Name
                                        </button>

                                        <button
                                            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors mt-0 whitespace-nowrap"
                                            onClick={() => handleSort('createdAt')}
                                        >
                                            Creation Date
                                        </button>

                                        <button
                                            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors mt-0 whitespace-nowrap"
                                            onClick={() => handleSort('updatedAt')}
                                        >
                                            Last Modified Date
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
                {getFilteredAndSortedJobComments().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-6xl mb-4">😢</span>
                        <p className="text-xl">No job comments found</p>
                        <p className="text-sm mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    view === 'grid' ? (
                        <div className="max-w-full mx-auto">
                            <HoverEffect 
                                items={formatEventsForHoverEffect(getFilteredAndSortedJobComments())} 
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
                                        onClick={() => handleSort('userID')}
                                    >
                                        <div className="flex items-center">
                                            User
                                            <span className="ml-2">{getSortIcon('userID')}</span>
                                        </div>
                                    </th>

                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('eventID')}
                                    >
                                        <div className="flex items-center">
                                            Event
                                            <span className="ml-2">{getSortIcon('eventID')}</span>
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
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('updatedAt')}
                                    >
                                        <div className="flex items-center">
                                            Last Modified
                                            <span className="ml-2">{getSortIcon('updatedAt')}</span>
                                        </div>
                                    </th>
                                
                                </tr>
                            </thead>
                            <tbody>
                                    {getFilteredAndSortedJobComments().map((jobComment) => (
                                        <tr 
                                            key={jobComment._id} 
                                            className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                            onClick={() => handleEventClick(jobComment._id)}
                                        >
                                            <td className="p-4 text-white">
                                                {users?.find(user => user._id === jobComment.userID)?.name}
                                            </td>
                                            <td className="p-4 text-white">
                                                {events?.find(event => event._id === jobComment.eventID)?.eventName}
                                            </td>
                                            <td className="p-4 text-white">
                                                {new Date(jobComment.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-white">
                                                {new Date(jobComment.updatedAt).toLocaleString()}
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
                    <div className="bg-neutral-900 p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                        <h2 className="text-red-500 text-2xl mb-4">Are you sure you want to delete this Correction?</h2>
                        <p className="text-neutral-300 mb-6">
                            This action cannot be undone. Once deleted, this job comment's data will be permanently removed from the system.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setShowDeletePopup(false)} 
                                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors"
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