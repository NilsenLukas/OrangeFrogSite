import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaList, FaEdit, FaTrashAlt, FaUsers, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch, FaAddressBook, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { Link, useNavigate } from 'react-router-dom';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { motion, AnimatePresence } from 'framer-motion';

export default function ViewEvent() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSortOptions, setShowSortOptions] = useState(false);
    // const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });


    // View toggle
    const [view, setView] = useState('grid');

    // Delete confirmation
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    // Sort config
    const selectRef = useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // Single filter: name only
    const [nameFilter, setNameFilter] = useState('');

    // Mobile search modal
    const [showSearchModal, setShowSearchModal] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events`);
            const sortedEvents = response.data.sort((a, b) => {
                // Sort by creation date descending initially
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setEvents(sortedEvents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching events:', error);
            setLoading(false);
        }
    };

    // Delete
    const handleDelete = (event) => {
        setEventToDelete(event);
        setShowDeletePopup(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND}/events/${eventToDelete._id}`);
            setEvents(events.filter(e => e._id !== eventToDelete._id));
            setShowDeletePopup(false);
            toast.success('Event deleted successfully!');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    // Edit
    const handleEdit = (event) => {
        navigate(`/admin/events/edit/${event._id}`, { state: { from: '/admin/manage-events' } });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
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

    // Filtering only by name
    const getFilteredAndSortedEvents = () => {
        let filtered = events.filter(event => {
            return !nameFilter || event.eventName.toLowerCase().includes(nameFilter.toLowerCase());
        });
    
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal, bVal;

                // Handle special sorting cases
                switch (sortConfig.key) {
                    case 'contractors':
                        aVal = a.assignedContractors?.length || 0;
                        bVal = b.assignedContractors?.length || 0;
                        break;
                    case 'jobComments':
                        aVal = a.jobCommentCount || 0;
                        bVal = b.jobCommentCount || 0;
                        break;
                    case 'correctionReports':
                        aVal = a.correctionCount || 0;
                        bVal = b.correctionCount || 0;
                        break;
                    default:
                        aVal = a[sortConfig.key];
                        bVal = b[sortConfig.key];
                }

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
                <p className="text-white">Loading events...</p>
            </div>
        );
    }

    const handleEventClick = (eventId) => {
        navigate(`/admin/events/${eventId}`);
    };

    const formatEventsForHoverEffect = (events) => {
        return events.map((event) => ({
            title: (
                <div className="flex justify-between items-center">
                    <span className="text-lg md:text-xl font-semibold">{event.eventName}</span>
                    <div 
                        className="flex space-x-3"
                        onClick={(e) => e.preventDefault()}
                    >
                        <FaEdit 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEdit(event);
                            }} 
                            className="text-blue-500 cursor-pointer text-xl md:text-2xl hover:text-blue-600 transition-colors" 
                        />
                        <FaTrashAlt 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(event);
                            }} 
                            className="text-red-500 cursor-pointer text-xl md:text-2xl hover:text-red-600 transition-colors" 
                        />
                    </div>
                </div>
            ),
            description: (
                <div className="space-y-6 py-2">
                    <div className="space-y-4">
                        <p className="text-neutral-400 font-medium text-base md:text-lg">Load In</p>
                        <div className="pl-3 border-l-2 border-neutral-700 space-y-2">
                            <p className="text-white text-sm md:text-base">{new Date(event.eventLoadIn).toLocaleString()}</p>
                            <p className="text-neutral-300 text-sm md:text-base">Hours: {event.eventLoadInHours}h</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-neutral-400 font-medium text-base md:text-lg">Load Out</p>
                        <div className="pl-3 border-l-2 border-neutral-700 space-y-2">
                            <p className="text-white text-sm md:text-base">{new Date(event.eventLoadOut).toLocaleString()}</p>
                            <p className="text-neutral-300 text-sm md:text-base">Hours: {event.eventLoadOutHours}h</p>
                        </div>
                    </div>
                    <div className="flex items-center pt-3 border-t border-neutral-700">
                        <FaUsers className="mr-2 text-neutral-400 text-lg md:text-xl" />
                        <span className="text-neutral-300 text-sm md:text-base">
                            {event.assignedContractors?.length || 0} Contractors
                        </span>
                    </div>
                </div>
            ),
            link: `/admin/events/${event._id}`,
            _id: event._id,
            onClick: (e) => {
                if (!e.defaultPrevented) {
                    handleEventClick(event._id);
                }
            },
            // Keep these for filtering but don't display them
            createdAt: event.createdAt,
            updatedAt: event.updatedAt
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
    

    return (
        <div className="w-full h-full overflow-auto px-2 md:px-5">
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-neutral-900 py-4 z-50">
                
                {/* Left section: Filter & Sort */}
                <div className="flex items-center gap-3 mt-2">
                    <div className='flex items-center gap-3 mt-3'>
                        {/* Name filter input - Desktop */}
                        <div className="relative hidden md:flex items-center mt-1">
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

                        {/* Name filter input - Mobile */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setShowSearchModal(true)}
                                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                            >
                                <FaSearch className="text-xl" />
                            </button>
                        </div>

                        {/* Sort dropdown - Desktop */}
                        <div className="hidden md:flex items-center gap-3 mt-2">
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
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-white text-sm whitespace-nowrap">Sort by:</span>

                                        <button
                                            className="px-4 py-1.5 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors"
                                            onClick={() => handleSort('eventName')}
                                        >
                                            Name
                                        </button>

                                        <button
                                            className="px-4 py-1.5 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors"
                                            onClick={() => handleSort('contractors')}
                                        >
                                            Contractors
                                        </button>

                                        <button
                                            className="px-4 py-1.5 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap"
                                            onClick={() => handleSort('createdAt')}
                                        >
                                            Creation Date
                                        </button>

                                        <button
                                            className="px-4 py-1.5 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors whitespace-nowrap"
                                            onClick={() => handleSort('updatedAt')}
                                        >
                                            Last Modified
                                        </button>

                                        <motion.button
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: 0.2 }}
                                            type="button"
                                            onClick={() => setShowSortOptions(false)}
                                            className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-full transition-colors"
                                        >
                                            Cancel
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sort dropdown - Mobile */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setShowSortOptions(true)}
                                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                            >
                                <FaSort className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* View toggles */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('grid')}
                        className={`p-2 rounded-full transition-colors ${
                            view === 'grid' 
                                ? 'bg-neutral-700 text-white' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                    >
                        <FaTh className="text-xl" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-2 rounded-full transition-colors ${
                            view === 'list' 
                                ? 'bg-neutral-700 text-white' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                    >
                        <FaList className="text-xl" />
                    </button>
                </div>
            </div>

            {/* Create Event Button - Desktop */}
            <Link to="/admin/events/create" className="hidden md:block">
                <HoverBorderGradient
                    containerClassName="rounded-full mt-0"
                    className="dark:bg-black bg-neutral-900 text-white flex items-center space-x-2 mt-0"
                >
                    <span className="text-lg mr-1">+</span> 
                    <span>Create Event</span>
                </HoverBorderGradient>
            </Link>

            {/* Create Event Button - Mobile */}
            <Link to="/admin/events/create" className="md:hidden fixed bottom-4 right-4 z-50">
                <button className="p-4 rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 transition-colors flex items-center justify-center w-14 h-14">
                    <span className="text-2xl font-light">+</span>
                </button>
            </Link>

            {/* Mobile Search Modal */}
            {showSearchModal && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-neutral-900 p-6 rounded-lg w-[90%] max-w-sm"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-lg font-medium">Search Events</h3>
                            <button
                                onClick={() => setShowSearchModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-full bg-neutral-800 text-white placeholder:text-white/50 outline-none border border-neutral-700 focus:border-neutral-600"
                            />
                            <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Mobile Sort Options Modal */}
            {showSortOptions && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-neutral-900 p-6 rounded-lg w-[90%] max-w-sm"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-lg font-medium">Sort by</h3>
                            <button
                                onClick={() => setShowSortOptions(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <button
                                className="w-full px-4 py-3 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors text-left"
                                onClick={() => {
                                    handleSort('eventName');
                                    setShowSortOptions(false);
                                }}
                            >
                                Name
                            </button>
                            <button
                                className="w-full px-4 py-3 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors text-left"
                                onClick={() => {
                                    handleSort('contractors');
                                    setShowSortOptions(false);
                                }}
                            >
                                Contractors
                            </button>
                            <button
                                className="w-full px-4 py-3 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors text-left"
                                onClick={() => {
                                    handleSort('createdAt');
                                    setShowSortOptions(false);
                                }}
                            >
                                Creation Date
                            </button>
                            <button
                                className="w-full px-4 py-3 bg-neutral-800 text-white text-sm rounded-full hover:bg-neutral-700 transition-colors text-left"
                                onClick={() => {
                                    handleSort('updatedAt');
                                    setShowSortOptions(false);
                                }}
                            >
                                Last Modified
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="relative z-0 pb-8">
                {getFilteredAndSortedEvents().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-6xl mb-4">😢</span>
                        <p className="text-xl">No events found</p>
                        <p className="text-sm mt-2">Try adjusting your filter or create a new event</p>
                    </div>
                ) : view === 'grid' ? (
                    <div className="max-w-full mx-auto">
                        <HoverEffect
                            items={formatEventsForHoverEffect(getFilteredAndSortedEvents())}
                            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
                            {/* Desktop Header */}
                            <thead className="bg-neutral-700 hidden md:table-header-group">
                                <tr>
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('eventName')}
                                    >
                                        <div className="flex items-center">
                                            Event Name
                                            <span className="ml-2">{getSortIcon('eventName')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('contractors')}
                                    >
                                        <div className="flex items-center">
                                            Contractors
                                            <span className="ml-2">{getSortIcon('contractors')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        <div className="flex items-center">
                                            Creation Date
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
                                    <th className="p-4 text-left text-white whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredAndSortedEvents().map((event) => (
                                    <tr 
                                        key={event._id} 
                                        className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer md:table-row flex flex-col"
                                        onClick={() => handleEventClick(event._id)}
                                    >
                                        {/* Mobile View */}
                                        <td className="md:hidden block p-4 bg-neutral-800">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-medium">{event.eventName}</span>
                                                <div className="flex space-x-3">
                                                    <FaEdit 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(event);
                                                        }} 
                                                        className="text-blue-500 cursor-pointer text-lg hover:text-blue-600 transition-colors" 
                                                    />
                                                    <FaTrashAlt 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(event);
                                                        }} 
                                                        className="text-red-500 cursor-pointer text-lg hover:text-red-600 transition-colors" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-2 text-sm">
                                                <div className="flex items-center text-neutral-300">
                                                    <FaUsers className="mr-2" />
                                                    {event.assignedContractors?.length || 0} Contractors
                                                </div>
                                                <div className="text-neutral-400">
                                                    Created: {new Date(event.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-neutral-400">
                                                    Modified: {new Date(event.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Desktop View */}
                                        <td className="p-4 text-white hidden md:table-cell">
                                            {event.eventName}
                                        </td>
                                        <td className="p-4 text-white hidden md:table-cell">
                                            {event.assignedContractors?.length || 0}
                                        </td>
                                        <td className="p-4 text-white hidden md:table-cell">
                                            {event.createdAt
                                                ? new Date(event.createdAt).toLocaleString()
                                                : 'Not modified'}
                                        </td>
                                        <td className="p-4 text-white hidden md:table-cell">
                                            {event.updatedAt
                                                ? new Date(event.updatedAt).toLocaleString()
                                                : 'Not modified'}
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex space-x-4">
                                                <FaEdit 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(event);
                                                    }} 
                                                    className="text-blue-500 cursor-pointer text-xl hover:text-blue-600 transition-colors" 
                                                    title="Edit Event" 
                                                />
                                                <FaTrashAlt 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(event);
                                                    }} 
                                                    className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition-colors" 
                                                    title="Delete Event" 
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Popup */}
            {showDeletePopup && (
                <Modal>
                    <div className="bg-neutral-900 p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                        <h2 className="text-red-500 text-2xl mb-4">
                            Are you sure you want to delete this Event?
                        </h2>
                        <p className="text-neutral-300 mb-6">
                            This action cannot be undone. Once deleted, this event's data will be
                            permanently removed from the system.
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
