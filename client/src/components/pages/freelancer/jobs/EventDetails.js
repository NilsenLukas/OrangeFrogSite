import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaInfoCircle, FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { AuthContext } from "../../../../AuthContext";
import Modal from '../../../Modal';

export default function EventDetails() {
    const { auth } = useContext(AuthContext); // Get user authentication context
    const { eventID } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [event, setEvent] = useState(null);
    const [comment, setComment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        jobComments: '',
    });
    // const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events/${eventID}`);
            setEvent(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setError(error.response?.data?.message || 'Error fetching event details');
            setLoading(false);
        }
    };

    const fetchJobCommentDetails = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events/job-comments/${eventID}/${auth.email}`);
            
            if (response.data) {
                setComment(response.data);
                setFormData({ jobComments: response.data.jobComments || '' }); // Pre-fill the textarea or set to empty string
            } 
        } catch (error) {
            setFormData({ jobComments: '' }); // Set an empty string for jobComments
        }
    };

    useEffect(() => {
        fetchEventDetails();
        fetchJobCommentDetails();
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
                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}/events/job-comments/${eventID}/${auth.email}`,
                    formattedData,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                // Ensure the response contains the comment with _id
                setComment(response.data); // Make sure to set the updated comment
            } else {
                const response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}/events/job-comments/${comment._id}`,
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
                await axios.delete(`${process.env.REACT_APP_BACKEND}/events/job-comments/${comment._id}`);
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

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full min-h-screen p-8 bg-gradient-to-b from-neutral-900 to-neutral-800"
        >
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-between items-center"
            >
                <Link 
                    to="/user/current-jobs"
                    className="mb-8 flex items-center text-neutral-400 hover:text-white transition-colors group"
                >
                    <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Current Jobs
                </Link>
            </motion.div>

            <motion.div 
                className="bg-neutral-800 rounded-lg p-8 shadow-2xl backdrop-blur-sm bg-opacity-90"
                {...fadeIn}
            >   
                <div className='mb-8 border-b border-neutral-700 pb-4 flex justify-between items-center'>
                    <motion.h1 
                        className="text-4xl font-bold text-white "
                        {...fadeIn}
                    >
                        {event.eventName}
                    </motion.h1>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div 
                        className="space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Event Details
                            </h2>
                            <div className="space-y-3 text-neutral-300">
                                <p className="flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-red-400" />
                                    <span className="font-medium">Location:</span>
                                    <span className="ml-2">{event.eventLocation}</span>
                                </p>
                                <div className="flex items-center">
                                    <FaClock className="mr-2 text-green-400" />
                                    <div className="flex-1">
                                        <div className="mb-2">
                                            <span className="font-medium">Load In:</span>
                                            <span className="ml-2">{new Date(event.eventLoadIn).toLocaleString()}</span>
                                            <span className="ml-2 text-green-400">({event.eventLoadInHours}h)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <FaClock className="mr-2 text-yellow-400" />
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
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Description
                            </h2>
                            <p className="text-neutral-300 leading-relaxed">
                                {event.eventDescription || 'No description provided'}
                            </p>
                        </div>
                    </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <div className='flex justify-between items-center'>
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                                Job Comments
                            </h2>
                            <div className="flex space-x-4 -mt-6">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                >
                                    <FaTrashAlt />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                        <textarea
                        name="jobComments"
                        type="text"
                        value={formData?.jobComments || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors h-32"
                        />
                    </div>

                    

                    {/* Submit Button */}
                    <div className="col-span-2 flex justify-center space-x-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-lg bg-black text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            {loading ? 'Saving...' : 'Save Comment'}
                        </button>
                    </div>
                </form>

                <div className="flex justify-center">
                    <Link to={`/user/corrections/create?eventID=${eventID}`}>
                        <HoverBorderGradient
                            containerClassName="rounded-full"
                            className="dark:bg-black bg-neutral-900 text-white flex items-center space-x-2"
                        >
                            <span className="text-lg mr-1">+</span> 
                            <span>Create Correction Report</span>
                        </HoverBorderGradient>
                    </Link>
                </div>
            </motion.div>

            {showDeletePopup && (
                <Modal>
                    <div className="bg-neutral-900 p-8 rounded-md shadow-lg w-full max-w-md border border-neutral-700">
                        <h2 className="text-red-500 text-2xl mb-4">Are you sure you want to delete this comment?</h2>
                        <p className="text-neutral-300 mb-6">
                            This action cannot be undone. Once deleted, this comment's data will be permanently removed from the system.
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
        </motion.div>
    );
}