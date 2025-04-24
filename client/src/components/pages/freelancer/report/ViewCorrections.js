// View/Manage User Correction Pages
import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { FaList, FaEdit, FaTrashAlt, FaSort, FaTh, FaSortUp, FaSortDown, FaSearch, FaFilter, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'sonner';
import Modal from "../../../Modal";
import { HoverEffect } from "../../../ui/card-hover-effect";
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from "../../../../AuthContext";
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-sm sm:text-base text-neutral-400">Loading corrections...</p>
    </div>
);

export default function ViewCorrections() {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [corrections, setCorrections] = useState([]);
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [correctionToDelete, setCorrectionToDelete] = useState(null);
    // Single filter: name only
    const [nameFilter, setNameFilter] = useState('');
    const selectRef = useRef(null);
    const [ setShowFilterDropdown] = useState(false);
    const [ setFilterField] = useState(null);
    const [setFilterValues] = useState({ name: '', location: '', startDate: '', endDate: '', contractor: [] });
    const filterDropdownRef = useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    

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
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/${auth.email}`);
            console.log(response.data); // Debug: Check what is actually returned
    
            // Ensure we're sorting the corrections array inside the response object
            const sortedCorrections = response.data.corrections.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setCorrections(sortedCorrections);
            setEvents(response.data.events);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching corrections:', error);
            setLoading(false);
        }
    };

    const handleDelete = (correction) => {
        setCorrectionToDelete(correction);
        setShowDeletePopup(true);
    };

    // Edit
    const handleEdit = (correction) => {
        navigate(`/user/corrections/edit/${correction._id}`, { state: { from: '/user/manage-corrections' } });
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

    // Filtering only by name
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
        return <LoadingSpinner />;
    }

    const handleEventClick = (correctionId) => {
        navigate(`/user/corrections/${correctionId}`);
    };

    const formatEventsForHoverEffect = (corrections) => {
        return corrections.map((correction) => {
            // Ensure events and correction.eventID exist before accessing properties
            const event = events?.find(e => e._id === correction.eventID);
            
            return {
                title: (
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                            {correction.correctionName}
                        </span>
                        <div 
                            className="flex space-x-3"
                            onClick={(e) => e.preventDefault()}
                        >
                            <FaEdit 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEdit(correction);
                                }} 
                                className="text-blue-500 cursor-pointer text-xl hover:text-blue-600 transition-colors" 
                            />
                            <FaTrashAlt 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(correction);
                                }} 
                                className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition-colors" 
                            />
                        </div>
                    </div>
                ),
                description: (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Status:</span>
                            <span className="ml-2 text-white">{correction.status}</span>
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
                link: `/user/corrections/${correction._id}`,
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
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            return { key, direction };
        });
    };

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
                Correction Reports
            </h1>

            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-4">
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
            <Link to="/user/corrections/create" className='mt-0 bg-none'>
                <HoverBorderGradient
                containerClassName="rounded-full"
                className="dark:bg-black bg-neutral-900 text-white flex items-center space-x-2 mt-0"
            >
                    <span className="text-lg mr-1">+</span> 
                    <span>Create Correction Report</span>
                </HoverBorderGradient>
            </Link>

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
                                    onClick={() => handleSort('correctionName')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Name
                                </button>
                                <button
                                    onClick={() => handleSort('requestType')}
                                    className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                                >
                                    Correction Type
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

            {/* Content Area */}
            <div className="flex-1">
                {getFilteredAndSortedCorrections().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-6xl mb-4">😢</span>
                        <p className="text-xl">No corrections found</p>
                        <p className="text-sm mt-2">Try adjusting your filters or create a new correction</p>
                    </div>
                ) : view === 'grid' ? (
                    <div className="max-w-full mx-auto">
                        <HoverEffect 
                            items={formatEventsForHoverEffect(getFilteredAndSortedCorrections())} 
                            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg">
                        <table className="min-w-full bg-neutral-800/50">
                            <thead className="bg-neutral-700">
                                <tr>
                                    <th 
                                        className="p-3 sm:p-4 text-left text-white cursor-pointer"
                                        onClick={() => handleSort('correctionName')}
                                    >
                                        <div className="flex items-center text-sm sm:text-base">
                                            Correction Name
                                            <span className="ml-2">{getSortIcon('correctionName')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-3 sm:p-4 text-left text-white cursor-pointer hidden sm:table-cell"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center text-sm sm:text-base">
                                            Status
                                            <span className="ml-2">{getSortIcon('status')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-3 sm:p-4 text-left text-white cursor-pointer hidden md:table-cell"
                                        onClick={() => handleSort('requestType')}
                                    >
                                        <div className="flex items-center text-sm sm:text-base">
                                            Correction Type
                                            <span className="ml-2">{getSortIcon('requestType')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="p-3 sm:p-4 text-left text-white cursor-pointer hidden lg:table-cell"
                                        onClick={() => handleSort('submittedAt')}
                                    >
                                        <div className="flex items-center text-sm sm:text-base">
                                            Created
                                            <span className="ml-2">{getSortIcon('submittedAt')}</span>
                                        </div>
                                    </th>
                                    <th className="p-3 sm:p-4 text-left text-white text-sm sm:text-base">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredAndSortedCorrections().map((correction) => (
                                    <tr 
                                        key={correction._id} 
                                        className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors"
                                    >
                                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{correction.correctionName}</span>
                                                <span className="text-neutral-400 text-xs sm:hidden">
                                                    {new Date(correction.submittedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden sm:table-cell">
                                            {correction.status}
                                        </td>
                                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden md:table-cell">
                                            {correction.requestType}
                                        </td>
                                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden lg:table-cell">
                                            {new Date(correction.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex space-x-4">
                                                <FaEdit 
                                                    onClick={() => handleEdit(correction)}
                                                    className="text-blue-500 cursor-pointer text-xl hover:text-blue-600 transition-colors" 
                                                />
                                                <FaTrashAlt 
                                                    onClick={() => handleDelete(correction)}
                                                    className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition-colors" 
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
                        <h2 className="text-red-500 text-2xl mb-4">Are you sure you want to delete this Correction?</h2>
                        <p className="text-neutral-300 mb-6">
                            This action cannot be undone. Once deleted, this correction's data will be permanently removed from the system.
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