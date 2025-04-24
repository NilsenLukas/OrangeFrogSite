// Edit Corrections Page
// Allows user to edit their correction report
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from "../../../../AuthContext";
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-sm sm:text-base text-neutral-400">Loading report details...</p>
    </div>
);

const EditCorrectionReport = () => {
    const { id } = useParams();
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        correctionName: '',
        eventID: '',
        userID: '',
        requestType: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                // Fetch events
                const eventsResponse = await fetch(`${process.env.REACT_APP_BACKEND}/events`);
                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    setEvents(eventsData);
                }

                // Fetch user profile
                const userResponse = await fetch(`${process.env.REACT_APP_BACKEND}/user-profile/${auth.email}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setFormData(prev => ({ ...prev, userID: userData._id }));
                }

                // Fetch correction details
                const correctionResponse = await fetch(`${process.env.REACT_APP_BACKEND}/corrections/${id}`);
                if (correctionResponse.ok) {
                    const correctionData = await correctionResponse.json();
                    setFormData({
                        correctionName: correctionData.correction.correctionName,
                        eventID: correctionData.correction.eventID,
                        requestType: correctionData.correction.requestType,
                        description: correctionData.correction.description,
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Error loading report details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, auth.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.correctionName || !formData.eventID || !formData.requestType || !formData.description) {
            toast.error("Please fill in all required fields");
            setLoading(false);
            return;
        }

        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });

        try {
            // Updates correction report
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/correction-report/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (response.ok) {
                toast.success("Report updated successfully");
                navigate(location.state?.from || '/user/manage-corrections');
            } else {
                toast.error("Failed to update report");
            }
        } catch (error) {
            console.error("Error updating report:", error);
            toast.error("Error updating report");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col w-full min-h-screen h-full p-4 sm:p-6 md:p-8 bg-neutral-900">
            <Link
                to={location.state?.from || '/user/manage-corrections'}
                className="mb-4 sm:mb-6 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
            >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Return to Corrections
            </Link>

            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-neutral-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                        Edit Correction Report
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm sm:text-base font-medium text-neutral-400 mb-2">
                                    Correction Name
                                </label>
                                <input
                                    type="text"
                                    name="correctionName"
                                    value={formData.correctionName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm sm:text-base font-medium text-neutral-400 mb-2">
                                    Event
                                </label>
                                <select
                                    name="eventID"
                                    value={formData.eventID}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    required
                                >
                                    <option value="">Select an Event</option>
                                    {events.map(event => (
                                        <option key={event._id} value={event._id}>
                                            {event.eventName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm sm:text-base font-medium text-neutral-400 mb-2">
                                    Request Type
                                </label>
                                <input
                                    type="text"
                                    name="requestType"
                                    value={formData.requestType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm sm:text-base font-medium text-neutral-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700 text-white border border-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => navigate(location.state?.from || '/user/manage-corrections')}
                                className="px-4 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors flex items-center gap-2"
                            >
                                <FaTimes className="text-lg" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaSave className="text-lg" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCorrectionReport;
