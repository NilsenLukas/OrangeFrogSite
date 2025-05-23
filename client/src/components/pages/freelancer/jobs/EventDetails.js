// User Event Detailed View Page
// Allows the user to view a detailed view of the event
// If the user has only accepted the event they can make job comments for the event
// If the user has been approved for the event the can make correction reports for the event
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaTh, FaList, FaSortUp, FaSortDown, FaSort, FaInfoCircle, FaTrashAlt, FaSave } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { AuthContext } from "../../../../AuthContext";
import Modal from '../../../Modal';
import { HoverEffect } from "../../../ui/card-hover-effect";

export default function EventDetails() {
    const { auth } = useContext(AuthContext); // Get user authentication context
    const { eventID } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [jobs, setJobs] = useState([]);
    const [jobStatuses, setJobStatuses] = useState({});
    const [confirmationType, setConfirmationType] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [event, setEvent] = useState(null);
    const [comment, setComment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        jobComments: '',
    });
    const [view, setView] = useState('grid');
    const [corrections, setCorrections] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [events, setEvents] = useState(null);
    const [ setShowFilterDropdown] = useState(false);
    const filterDropdownRef = useRef(null);
    // const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [isInvoiceEligible, setIsInvoiceEligible] = useState(false);
    // const navigate = useNavigate();

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const fetchEventDetails = async () => {
        try {
            // Fetches event information
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events/${eventID}`);

            
            setEvent(response.data);
            if (auth?.userId && response.data?._id) {
                try {
                  const eligibleRes = await fetch(`${process.env.REACT_APP_BACKEND}/events/eligible-events/${auth.userId}`);
                  const eligibleData = await eligibleRes.json();
                  const isEligible = eligibleData.some(e => e._id === response.data._id);
                  setIsInvoiceEligible(isEligible);
                } catch (err) {
                  console.error("Error checking invoice eligibility", err);
                }
              }
            setLoading(false);

            
        } catch (error) {
            console.error('Error fetching event details:', error);
            setError(error.response?.data?.message || 'Error fetching event details');
            setLoading(false);
        }
    };

    const fetchJobCommentDetails = async () => {
        try {
            // Fetches job comment details
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/job-comments/${eventID}/${auth.email}`);
            
            if (response.data) {
                setComment(response.data);
                setFormData({ jobComments: response.data.jobComments || '' }); // Pre-fill the textarea or set to empty string
            } 
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching job comment:', error);
            }
            setFormData({ jobComments: '' }); // fallback to empty comment
        }
    };

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
            // Fetches user corrections for that event
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/event/${auth.email}/${eventID}`);
    
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

    useEffect(() => {
        fetchEventDetails();
        fetchJobCommentDetails();
        fetchCorrections();

        
    }, [eventID]);

    if (loading) {
        return <div className="text-white text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    if (!event) {
        return <div className="text-white text-center mt-8">Event not found</div>;
    }

    const openConfirmModal = (type, jobId) => {
        setConfirmationType(type);
        setSelectedJobId(jobId);
        setShowConfirmModal(true);
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // Validate required fields
        if (!formData.jobComments) {
            toast.error("Please fill in all required fields.");
            setLoading(false);
            return;
        }
    
        const formattedData = {
            ...formData,
        };
    
        try {
            if (!comment) {
                // Creates a job comment if it does not already exist
                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}/job-comments/${eventID}/${auth.email}`,
                    formattedData,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                // Ensure the response contains the comment with _id
                setComment(response.data); // Make sure to set the updated comment
                // Updates job comment if a comment already exists
            } else {
                const response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}/job-comments/${comment._id}`,
                    formattedData,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                // Update the comment state with the updated response
                setComment(response.data); // Make sure to set the updated comment
            }
    
            toast.success('Job comment saved/updated successfully.');
    
            // After saving or updating, fetch the latest comment from the backend
            fetchJobCommentDetails(); // Reload the comment details
    
        } catch (error) {
            console.error('Error updating job comment:', error);
            toast.error('Failed to save/update job comment.');
        } finally {
            setLoading(false);
        }
    };
    
    
    const handleDelete = () => {
        if (comment) {
            setShowDeletePopup(true);
        } else {
            toast.success('No comment has been saved');
        }
    };
    
    const confirmDelete = async () => {
        try {
            if (comment) {
                // Deletes job comment
                await axios.delete(`${process.env.REACT_APP_BACKEND}/job-comments/${comment._id}`);
                setShowDeletePopup(false);
                setFormData({ jobComments: '' });
                setComment(null); // Reset the local state
                toast.success('Comment deleted successfully!');
            } else {
                toast.error('No comment to delete');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    // Input change handler
    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value,
        });
    };

    const handleConfirm = async () => {
        if (confirmationType === 'apply') {
            await handleApply(selectedJobId);
        } else if (confirmationType === 'reject') {
            await handleReject(selectedJobId);
        }
        setShowConfirmModal(false);
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

    const handleReject = async (id) => {
        try {
            // User rejects application to job
            await axios.post(`${process.env.REACT_APP_BACKEND}/events/reject-application`, {
                eventId: id,
                userEmail: auth.email,
            });
            setJobStatuses((prev) => ({ ...prev, [id]: "Rejected" }));
            setJobs((prevJobs) => prevJobs.filter((job) => job._id !== id));
            navigate("/user/current-jobs")
        } catch (error) {
            console.error("Error rejecting job:", error);
        }
    };

    const handleEventClick = (correctionId) => {
        navigate(`/user/corrections/${correctionId}`);
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
                    </div>
                ),
                description: (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Status:</span>
                            <span className="ml-2 text-white">{correction.status}</span>
                        </div>
                        <div className="space-y-2">
                            <span className="text-neutral-400 font-medium">Correction Type:</span>
                            <span className="ml-2 text-white">{correction.requestType}</span>
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

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-b from-neutral-900 to-neutral-800"
        >
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-between items-center"
            >
                <Link 
                    to="/user/current-jobs"
                    className="mb-4 sm:mb-6 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors group text-sm sm:text-base"
                >
                    <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Current Jobs
                </Link>
            </motion.div>

            <motion.div 
                className="bg-neutral-800 rounded-lg p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-sm bg-opacity-90"
                {...fadeIn}
            >   
                <div className='mb-6 sm:mb-8 border-b border-neutral-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0'>
                    <motion.h1 
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                        {...fadeIn}
                    >
                        {event.eventName}
                    </motion.h1>

                    <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto'>
                        {isInvoiceEligible && (
                            <button
                                onClick={() => navigate(`/user/invoices/new?eventId=${event._id}`)}
                                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                            >
                                <span className="text-lg">+</span>
                                <span>Generate Invoice</span>
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                openConfirmModal('reject', event._id);
                            }}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                        >
                            ✖ End Application
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    <motion.div 
                        className="space-y-4 sm:space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Event Details
                            </h2>
                            <div className="space-y-3 text-neutral-300 text-sm sm:text-base">
                                <p className="flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-red-400 flex-shrink-0" />
                                    <span className="font-medium">Location:</span>
                                    <span className="ml-2 break-words">{event.eventLocation}</span>
                                </p>
                                <div className="flex items-start sm:items-center flex-col sm:flex-row">
                                    <FaClock className="mr-2 text-green-400 mt-1 sm:mt-0" />
                                    <div className="flex-1">
                                        <div className="mb-2">
                                            <span className="font-medium">Load In:</span>
                                            <span className="ml-2">{new Date(event.eventLoadIn).toLocaleString()}</span>
                                            <span className="ml-2 text-green-400">({event.eventLoadInHours}h)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start sm:items-center flex-col sm:flex-row">
                                    <FaClock className="mr-2 text-yellow-400 mt-1 sm:mt-0" />
                                    <div className="flex-1">
                                        <div>
                                            <span className="font-medium">Load Out:</span>
                                            <span className="ml-2">{new Date(event.eventLoadOut).toLocaleString()}</span>
                                            <span className="ml-2 text-yellow-400">({event.eventLoadOutHours}h)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="space-y-4 sm:space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Description
                            </h2>
                            <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
                                {event.eventDescription || 'No description provided'}
                            </p>
                        </div>
                    </motion.div>
                </div>
                
                {event?.acceptedContractors?.some(contractor => contractor._id.toString() === auth.userId.toString()) && (
                    <form onSubmit={handleSubmit} className="mt-6 sm:mt-8">
                        <div className="flex flex-col space-y-4">
                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 w-full'>
                                <h2 className="text-lg sm:text-xl font-semibold text-white">
                                    Job Comments:
                                </h2>
                                <div className="flex flex-wrap justify-end gap-2 sm:gap-4 w-full max-w-full">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                    >
                                        <FaSave />
                                        <span>{loading ? 'Saving...' : 'Save'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                                    >
                                        <FaTrashAlt />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                            <textarea
                                name="jobComments"
                                value={formData?.jobComments || ''}
                                onChange={handleChange}
                                className="w-full p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors h-32 text-sm sm:text-base"
                            />
                        </div>
                    </form>
                )}

                {event?.approvedContractors?.some(contractor => contractor._id.toString() === auth.userId.toString()) && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-white">Correction Reports:</h2>
                        <Link to={`/user/corrections/create?eventID=${eventID}`}>
                            <button className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base">
                                <span className="text-lg">+</span>
                                <span>Create Correction Report</span>
                            </button>
                        </Link>
                    </div>
                )}

                {event?.approvedContractors?.some(contractor => contractor._id.toString() === auth.userId.toString()) && (
                    <div className='bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6 mt-4 sm:mt-6'>
                        <div className="mt-2">
                            <div className="w-full overflow-auto px-2 sm:px-5">
                                <div className="flex items-center gap-2 relative">
                                    <div className="hidden md:flex gap-2 mt-4">
                                        <button
                                            onClick={() => setView('grid')}
                                            className={`p-2 rounded transition-colors ${
                                                view === 'grid' 
                                                    ? 'bg-neutral-700 text-white' 
                                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                            }`}
                                        >
                                            <FaTh className="text-lg sm:text-xl" />
                                        </button>
                                        <button
                                            onClick={() => setView('list')}
                                            className={`p-2 rounded transition-colors ${
                                                view === 'list' 
                                                    ? 'bg-neutral-700 text-white' 
                                                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                                            }`}
                                        >
                                            <FaList className="text-lg sm:text-xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-0 pb-8">
                                {getFilteredAndSortedCorrections().length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[40vh] sm:h-[50vh] text-neutral-400">
                                        <span className="text-4xl sm:text-6xl mb-4">😢</span>
                                        <p className="text-base sm:text-xl">No corrections found</p>
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
                                                        <th className="p-3 sm:p-4 text-left text-white cursor-pointer whitespace-nowrap text-sm sm:text-base">
                                                            <div className="flex items-center">
                                                                Correction Name
                                                                <span className="ml-2">{getSortIcon('correctionName')}</span>
                                                            </div>
                                                        </th>
                                                        <th className="p-3 sm:p-4 text-left text-white cursor-pointer whitespace-nowrap hidden sm:table-cell text-sm sm:text-base">
                                                            <div className="flex items-center">
                                                                Status
                                                                <span className="ml-2">{getSortIcon('status')}</span>
                                                            </div>
                                                        </th>
                                                        <th className="p-3 sm:p-4 text-left text-white cursor-pointer whitespace-nowrap hidden md:table-cell text-sm sm:text-base">
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
                                                            <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                                                                <div className="flex flex-col">
                                                                    <span>{correction.correctionName}</span>
                                                                    <span className="text-neutral-400 text-xs mt-1 sm:hidden">
                                                                        {correction.status} - {correction.requestType}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-white hidden sm:table-cell text-sm sm:text-base">
                                                                {correction.status}
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-white hidden md:table-cell text-sm sm:text-base">
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
                )}
            </motion.div>

            {showDeletePopup && (
                <Modal>
                    <div className="bg-neutral-900 p-4 sm:p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                        <h2 className="text-xl sm:text-2xl text-red-500 mb-4">Are you sure you want to delete this comment?</h2>
                        <p className="text-sm sm:text-base text-neutral-300 mb-6">
                            This action cannot be undone. Once deleted, this comment's data will be permanently removed from the system.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setShowDeletePopup(false)} 
                                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full transition-colors text-sm sm:text-base"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showConfirmModal && (
                <Modal>
                    <div className="bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-4 sm:p-6 border-b border-neutral-700">
                            <h3 className="text-lg sm:text-xl font-semibold text-white">
                                {confirmationType === "apply" ? "Confirm Application" : "End Job Application"}
                            </h3>
                        </div>

                        <div className="p-4 sm:p-6">
                            <p className="text-sm sm:text-base text-neutral-300 mb-6">
                                {confirmationType === "apply"
                                    ? "By applying to this event, you acknowledge that if approved, you will be required to work this event and cannot reject it later. Are you sure you want to apply?"
                                    : "Are you sure you want to end your application to this event?"}
                            </p>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
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
        </motion.div>
    );
}