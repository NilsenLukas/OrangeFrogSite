import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaTh, FaList, FaInfoCircle, FaEdit, FaTrashAlt, FaUsers, FaCheck, FaTimes, FaSortUp, FaSortDown, FaSort, } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../../../Modal';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { HoverEffect } from "../../../ui/card-hover-effect";
import { AuthContext } from "../../../../AuthContext";

export default function EventDetails() {
    const { auth } = useContext(AuthContext);
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [view, setView] = useState('grid');
    const [corrections, setCorrections] = useState([]);
    const [jobComments, setJobComments] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [events, setEvents] = useState(null);
    const [ setShowFilterDropdown] = useState(false);
    const filterDropdownRef = useRef(null);
    const [users, setUsers] = useState(null);

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events/${eventId}`);
            setEvent(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setError(error.response?.data?.message || 'Error fetching event details');
            setLoading(false);
        }
    };

    const fetchCorrections = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/event/${eventId}`);
    
            // Ensure we're sorting the corrections array inside the response object
            const sortedCorrections = response.data.corrections.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setCorrections(sortedCorrections);
            setEvents(response.data.events);
            setUsers(response.data.users);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching corrections:', error);
            setLoading(false);
        }
    };

    const fetchJobComments = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/job-comments/event/${eventId}`);
    
            // Ensure we're sorting the Job Comment array inside the response object
            const sortedJobComments = response.data.jobComments.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            setJobComments(sortedJobComments);
    
            setLoading(false);
        } catch (error) {
            console.error('Error fetching job comments:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorrections();
        fetchEventDetails();
        fetchJobComments();
    }, [eventId]);

    const handleContractorClick = (contractor) => {
        if (event.acceptedContractors?.some(c => c._id === contractor._id)) {
            setSelectedContractor(contractor);
            setShowApprovalModal(true);
        }
    };

    const handleApproval = async (approved) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/events/${event._id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractorId: selectedContractor._id,
                    approved
                }),
            });

            if (response.ok) {
                // Refresh event data
                fetchEventDetails();
                setShowApprovalModal(false);
                toast.success(approved ? 'Contractor approved successfully' : 'Contractor rejected');
            }
        } catch (error) {
            console.error('Error updating contractor status:', error);
            toast.error('Error updating contractor status');
        }
    };

    const handleEdit = (event) => {
        navigate(`/admin/events/edit/${event._id}`, { state: { from: `/admin/events/${event._id}` } });
    };

    const handleDelete = () => {
        setShowDeletePopup(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND}/events/${eventId}`);
            setShowDeletePopup(false);
            toast.success('Event deleted successfully!');
            navigate('/admin/manage-events');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            return { key, direction };
        });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
    };

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

    // Filtering only by name
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

    const formatJobCommentsForHoverEffect = (jobComments) => {
        return jobComments.map((jobComment) => {
            // Ensure events and jobComment.eventID exist before accessing properties
            const event = events?.find(e => e._id === jobComment.eventID);
            const user = users?.find(e => e._id === jobComment.userID);
    
            return {
                title: (
                    <div className="flex gap-2 items-center text-lg ">
                        <span className="text-neutral-400">User:</span>
                        <span className="font-semibold flex start">
                            {user?.name}
                        </span>
                    </div>
                ),
                description: (
                    <div className="space-y-4">
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

    const formatEventsForHoverEffect = (corrections) => {
        return corrections.map((correction) => {
            // Ensure events and correction.eventId exist before accessing properties
            const event = events?.find(e => e._id === correction.eventId);
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
                            <span className="text-neutral-400 font-medium">Correction Type:</span>
                            <span className="ml-2 text-white">{correction.requestType}</span>
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

    const handleEventClick = (correctionId) => {
        navigate(`/admin/corrections/${correctionId}`);
    };

    const handleJobCommentClick = (jobCommentId) => {
        navigate(`/admin/job-comments/${jobCommentId}`);
    };

    if (loading) {
        return <div className="text-white text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    if (!event) {
        return <div className="text-white text-center mt-8">Event not found</div>;
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full min-h-screen p-4 md:p-8 bg-gradient-to-b from-neutral-900 to-neutral-800"
        >
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0"
            >
                <Link 
                    to="/admin/manage-events"
                    className="mb-2 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors group"
                >
                    <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Events
                </Link>
            </motion.div>

            <motion.div 
                className="bg-neutral-800 rounded-lg p-4 md:p-8 shadow-2xl backdrop-blur-sm bg-opacity-90"
                {...fadeIn}
            >   
                <div className='mb-4 md:mb-8 border-b border-neutral-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                    <motion.h1 
                        className="text-2xl md:text-4xl font-bold text-white"
                        {...fadeIn}
                    >
                        {event.eventName}
                    </motion.h1>
                    <div className="flex space-x-2 md:space-x-4 w-full md:w-auto">
                        <button
                            onClick={() => handleEdit(event)}
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            <FaEdit className="md:mr-2" />
                            <span className="hidden md:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            <FaTrashAlt className="md:mr-2" />
                            <span className="hidden md:inline">Delete</span>
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <motion.div 
                        className="space-y-4 md:space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 md:p-6">
                            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Event Details
                            </h2>
                            <div className="space-y-3 text-neutral-300 text-sm md:text-base">
                                <p className="flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-red-400 flex-shrink-0" />
                                    <span className="font-medium mr-2">Location:</span>
                                    <span className="break-all">{event.eventLocation}</span>
                                </p>
                                <div className="flex items-start">
                                    <FaClock className="mr-2 text-green-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="mb-2">
                                            <span className="font-medium">Load In:</span>
                                            <div className="ml-2">
                                                <div>{new Date(event.eventLoadIn).toLocaleString()}</div>
                                                <div className="text-green-400">({event.eventLoadInHours}h)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <FaClock className="mr-2 text-yellow-400 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div>
                                            <span className="font-medium">Load Out:</span>
                                            <div className="ml-2">
                                                <div>{new Date(event.eventLoadOut).toLocaleString()}</div>
                                                <div className="text-yellow-400">({event.eventLoadOutHours}h)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="flex items-center">
                                    <span className="font-medium mr-2">Created:</span>
                                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-medium mr-2">Last Modified:</span>
                                    <span>{new Date(event.updatedAt).toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="space-y-4 md:space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 md:p-6">
                            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Description
                            </h2>
                            <p className="text-neutral-300 leading-relaxed text-sm md:text-base">
                                {event.eventDescription || 'No description provided'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <div className="mt-6 md:mt-8">
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Invited Freelancers</h2>
                <div className="bg-neutral-800 rounded-lg p-4 md:p-6">
                    {event?.assignedContractors?.filter(contractor => 
                        !event.approvedContractors?.some(ac => ac._id === contractor._id)
                    ).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {event.assignedContractors
                                .filter(contractor => 
                                    !event.approvedContractors?.some(ac => ac._id === contractor._id)
                                )
                                .map((contractor) => (
                                    <div 
                                        key={contractor._id}
                                        className="bg-neutral-700 rounded-lg p-3 md:p-4 flex flex-col cursor-pointer hover:bg-neutral-600 transition-colors"
                                        onClick={() => handleContractorClick(contractor)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-white font-medium text-sm md:text-base truncate">{contractor.name}</h3>
                                                <p className="text-neutral-400 text-xs md:text-sm truncate">{contractor.email}</p>
                                            </div>
                                            <div className="ml-2 flex-shrink-0">
                                                {event.acceptedContractors?.some(c => c._id === contractor._id) ? (
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs whitespace-nowrap">
                                                        Applied
                                                    </span>
                                                ) : event.rejectedContractors?.some(c => c._id === contractor._id) ? (
                                                    <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs whitespace-nowrap">
                                                        Declined
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs whitespace-nowrap">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-neutral-400 text-center text-sm md:text-base">No freelancers have been invited to this event.</p>
                    )}
                </div>
            </div>

            <div className="mt-6 md:mt-8">
                <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Approved Freelancers</h2>
                <div className="bg-neutral-800 rounded-lg p-4 md:p-6">
                    {event?.approvedContractors?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {event.approvedContractors.map((contractor) => (
                                <div 
                                    key={contractor._id}
                                    className="bg-neutral-700 rounded-lg p-3 md:p-4 flex flex-col"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-white font-medium text-sm md:text-base truncate">{contractor.name}</h3>
                                            <p className="text-neutral-400 text-xs md:text-sm truncate">{contractor.email}</p>
                                        </div>
                                        <span className="ml-2 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs whitespace-nowrap">
                                            Approved
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-neutral-400 text-center text-sm md:text-base">No approved freelancers yet.</p>
                    )}
                </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-4 mt-8">Job Comments</h2>

            <div className='bg-neutral-700 bg-opacity-40 rounded-lg p-6 pt-0 mt-2'>
                <div className="mt-8">
                        <div className="w-full h-full overflow-auto px-5">
                    <div className="flex items-center gap-2 relative">
                    
                    <div className="hidden md:flex gap-2">
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
                    </div>
                ) : (
                    view === 'grid' ? (
                        <div className="max-w-full mx-auto">
                            <HoverEffect 
                                items={formatJobCommentsForHoverEffect(getFilteredAndSortedJobComments())} 
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
            </div>
            </div>

            <h2 className="text-xl font-semibold text-white mb-4 mt-8">Correction Reports</h2>

            <div className='bg-neutral-700 bg-opacity-40 rounded-lg p-6 pt-0 mt-2'>
                <div className="mt-8">
                        <div className="w-full h-full overflow-auto px-5">
                    <div className="flex items-center gap-2 relative">
                    
                    <div className="hidden md:flex gap-2">
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
                {getFilteredAndSortedCorrections().length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-400">
                        <span className="text-6xl mb-4">😢</span>
                        <p className="text-xl">No corrections found</p>
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-neutral-800/50 rounded-lg overflow-hidden">
                            <thead className="bg-neutral-700">
                                <tr>
                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('correctionName')}
                                    >
                                        <div className="flex items-center">
                                            Correction Name
                                            <span className="ml-2">{getSortIcon('correctionName')}</span>
                                        </div>
                                    </th>

                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status
                                            <span className="ml-2">{getSortIcon('status')}</span>
                                        </div>
                                    </th>

                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('userID')}
                                    >
                                        <div className="flex items-center">
                                            Created By
                                            <span className="ml-2">{getSortIcon('userID')}</span>
                                        </div>
                                    </th>

                                    <th 
                                        className="p-4 text-left text-white cursor-pointer whitespace-nowrap"
                                        onClick={() => handleSort('requestType')}
                                    >
                                        <div className="flex items-center">
                                            Correction Type
                                            <span className="ml-2">{getSortIcon('requestType')}</span>
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
                                            <td className="p-4 text-white">
                                                {correction.correctionName}
                                            </td>
                                            <td className="p-4 text-white">
                                                {correction.status}
                                            </td>
                                            <td className="p-4 text-white">
                                                {users?.find(user => user._id === correction.userID)?.name}
                                            </td>
                                            <td className="p-4 text-white">
                                                {correction.requestType}
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
            </div>

            {showApprovalModal && (
                <Modal>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-neutral-900 p-6 md:p-8 rounded-xl max-w-md w-[90%] md:w-full mx-4 border border-neutral-800 shadow-2xl"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 p-3 bg-neutral-800/50 rounded-full">
                                <FaUsers className="text-2xl md:text-3xl text-blue-400" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                                Contractor Approval
                            </h3>
                            <p className="text-neutral-400 mb-6 md:mb-8 text-sm md:text-base">
                                Do you want to approve or deny <span className="text-white font-medium">{selectedContractor?.name}</span> for this event?
                            </p>
                            
                            <div className="flex gap-2 md:gap-3 w-full">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApproval(true)}
                                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                                >
                                    <FaCheck className="text-sm" />
                                    Approve
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApproval(false)}
                                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                                >
                                    <FaTimes className="text-sm" />
                                    Deny
                                </motion.button>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowApprovalModal(false)}
                                className="mt-4 px-4 md:px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm md:text-base"
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </motion.div>
                </Modal>
            )}

            {showDeletePopup && (
                <Modal>
                    <div className="bg-neutral-900 p-6 md:p-8 rounded-md shadow-lg w-[90%] max-w-md mx-4 border border-neutral-700">
                        <h2 className="text-red-500 text-xl md:text-2xl mb-4">Are you sure you want to delete this Event?</h2>
                        <p className="text-neutral-300 mb-6 text-sm md:text-base">
                            This action cannot be undone. Once deleted, this event's data will be permanently removed from the system.
                        </p>
                        <div className="flex justify-end gap-3 md:gap-4">
                            <button 
                                onClick={() => setShowDeletePopup(false)} 
                                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors text-sm md:text-base"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors text-sm md:text-base"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </motion.div>
    );
}