// Admin Correction Report Detailed View Page
// Allow Admin to view detailed view of a correction report
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaInfoCircle, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Modal from '../../../Modal';

export default function CorrectionDetails() {
    const { correctionId } = useParams();
    const navigate = useNavigate();
    const [correction, setCorrection] = useState(null);
    const [event, setEvent] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const fetchCorrectionDetails = async () => {
        try {
            // Fetches correction report
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/${correctionId}`);
            setCorrection(response.data.correction);
            setUser(response.data.userName);
            setEvent(response.data.event);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching correction details:', error);
            setError(error.response?.data?.message || 'Error fetching correction details');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCorrectionDetails();
    }, [correctionId]);

    // const handleEdit = (correction) => {
    //     navigate(`/admin/corrections/edit/${correction._id}`, { state: { from: `/admin/corrections/${correction._id}` } });
    // };

    const handleUpdateStatus = (correction) => {
        navigate(`/admin/corrections/update-status/${correction._id}`, { state: { from: `/admin/corrections/${correction._id}` } });
    };

    // const handleDelete = () => {
    //     setShowDeletePopup(true);
    // };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND}/corrections/${correctionId}`);
            setShowDeletePopup(false);
            toast.success('Correction deleted successfully!');
            navigate('/admin/manage-corrections');
        } catch (error) {
            console.error('Error deleting correction:', error);
            toast.error('Failed to delete correction');
        }
    };

    if (loading) {
        return <div className="text-white text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    if (!correction) {
        return <div className="text-white text-center mt-8">Correction not found</div>;
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full min-h-screen p-4 sm:p-8 bg-gradient-to-b from-neutral-900 to-neutral-800"
        >
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-between items-center"
            >
                <Link 
                    to="/admin/manage-corrections"
                    className="mb-4 sm:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors group text-sm sm:text-base"
                >
                    <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Corrections
                </Link>
            </motion.div>

            <motion.div 
                className="bg-neutral-800 rounded-lg p-4 sm:p-8 shadow-2xl backdrop-blur-sm bg-opacity-90"
                {...fadeIn}
            >   
                <div className='mb-4 sm:mb-8 border-b border-neutral-700 pb-4 flex justify-between items-center'>
                    <motion.h1 
                        className="text-2xl sm:text-4xl font-bold text-white"
                        {...fadeIn}
                    >
                        {correction.correctionName}
                    </motion.h1>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <motion.div 
                        className="space-y-4 sm:space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Event Details
                            </h2>
                            <div className="space-y-2 sm:space-y-3 text-neutral-300 text-sm sm:text-base">
                                <p className="flex items-center">
                                    <FaInfoCircle className="mr-2 text-grey-400" />
                                    <span className="font-medium">Event:</span>
                                    <span className="ml-2 text-white">
                                        <Link 
                                            to={`/admin/events/${event._id}`}
                                            className="hover:text-blue-500 transition-colors group"
                                        >
                                            <u>{event.eventName}</u>
                                        </Link>
                                    </span>
                                </p>
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
                                            <span className="ml-2">{new Date(event.eventLoadIn).toLocaleDateString()}</span>
                                            <span className="ml-2 text-green-400">({event.eventLoadInHours}h)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <FaClock className="mr-2 text-yellow-400" />
                                    <div className="flex-1">
                                        <div>
                                            <span className="font-medium">Load Out:</span>
                                            <span className="ml-2">{new Date(event.eventLoadOut).toLocaleDateString()}</span>
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
                            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                                <FaInfoCircle className="mr-2 text-blue-400" />
                                Correction Details
                            </h2>
                            <div className="space-y-2 sm:space-y-3 text-neutral-300 text-sm sm:text-base">
                                <p className="flex items-center">
                                    <span className="font-medium">Created by:</span>
                                    <span className="ml-2">{user}</span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-medium">Correction Type:</span>
                                    <span className="ml-2">{correction.requestType}</span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-medium">Created:</span>
                                    <span className="ml-2">{new Date(correction.submittedAt).toLocaleDateString()}</span>
                                </p>
                                <p className="flex items-center">
                                    <span className="font-medium">Last Modified:</span>
                                    <span className="ml-2">{new Date(correction.updatedAt).toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <div className="mt-4 sm:mt-8">
                <div className="bg-neutral-800 rounded-lg p-4 sm:p-6">
                    <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                            <FaInfoCircle className="mr-2 text-blue-400" />
                            Description
                        </h2>
                        <div className="space-y-2 sm:space-y-3 text-neutral-300 text-sm sm:text-base">
                            <p className="flex items-center">
                                <span className="ml-2">{correction.description}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 sm:p-6 mt-4">
                    <div className="bg-neutral-700 bg-opacity-40 rounded-lg p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                            <FaInfoCircle className="mr-2 text-blue-400" />
                            Status: {correction.status}
                        </h2>
                        <div className="space-y-2 sm:space-y-3 text-neutral-300 text-sm sm:text-base">
                            <p className="flex items-center">
                                <span className="ml-2">{correction.additionalComments}</span>
                            </p>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => handleUpdateStatus(correction)}
                                className="flex justify-center items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
                            >
                                <FaEdit />
                                <span>Update Status</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
        </motion.div>
    );
}