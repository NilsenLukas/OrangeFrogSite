// Admin Edit Event Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import MultiSelect from './MultiSelect';
import { FaArrowLeft } from 'react-icons/fa';

export default function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const location = useLocation();

    const [formData, setFormData] = useState({
        eventName: '',
        eventLoadIn: '',
        eventLoadInHours: '',
        eventLoadOut: '',
        eventLoadOutHours: '',
        eventLocation: '',
        eventDescription: '',
        assignedContractors: []
    });

    useEffect(() => {
        const fetchEventAndContractors = async () => {
            try {
                const [eventRes, contractorsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND}/events/${id}`),
                    axios.get(`${process.env.REACT_APP_BACKEND}/users`)
                ]);

                // Format dates for input fields
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16);
                };

                setFormData({
                    eventName: eventRes.data.eventName,
                    eventLoadIn: formatDate(eventRes.data.eventLoadIn),
                    eventLoadInHours: eventRes.data.eventLoadInHours,
                    eventLoadOut: formatDate(eventRes.data.eventLoadOut),
                    eventLoadOutHours: eventRes.data.eventLoadOutHours,
                    eventLocation: eventRes.data.eventLocation,
                    eventDescription: eventRes.data.eventDescription || '',
                    assignedContractors: eventRes.data.assignedContractors?.map(contractor => contractor._id) || []
                });
                setContractors(contractorsRes.data.filter(user => user.status === 'active'));
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndContractors();
    }, [id]);

    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const getMinLoadOutDateTime = () => {
        if (!formData.eventLoadIn) return getCurrentDateTime();
        return formData.eventLoadIn;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'eventLoadIn') {
            setFormData(prev => {
                if (prev.eventLoadOut && new Date(prev.eventLoadOut) < new Date(value)) {
                    return {
                        ...prev,
                        [name]: value,
                        eventLoadOut: value
                    };
                }
                return {
                    ...prev,
                    [name]: value
                };
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Only send the fields that have actually changed
            const updatedFields = {};
            const originalEvent = await axios.get(`${process.env.REACT_APP_BACKEND}/events/${id}`);
            
            // Compare each field and only include changed ones
            Object.keys(formData).forEach(key => {
                if (JSON.stringify(formData[key]) !== JSON.stringify(originalEvent.data[key])) {
                    updatedFields[key] = formData[key];
                }
            });

            // Only make the API call if there are actual changes
            if (Object.keys(updatedFields).length > 0) {
                await axios.put(`${process.env.REACT_APP_BACKEND}/events/${id}`, updatedFields);
                toast.success('Event updated successfully');
            } else {
                toast.info('No changes were made');
            }
            
            navigate(location.state?.from);
        } catch (error) {
            console.error('Error updating event:', error);
            toast.error('Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 md:mb-8">
                    <Link 
                        to="/admin/manage-events"
                        className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-4"
                    >
                        <FaArrowLeft className="w-4 h-4 mr-2" />
                        <span className="text-sm">Back to Events</span>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Event</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-neutral-800 rounded-lg shadow-xl p-6 md:p-8 space-y-8">
                    {/* Event Name */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Event Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleInputChange}
                            maxLength={40}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                            required
                        />
                        <p className="text-xs text-neutral-400">
                            {formData.eventName.length}/40 characters
                        </p>
                    </div>

                    {/* Date and Time Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Load In Section */}
                        <div className="space-y-2">
                            <label className="block text-neutral-200 text-sm font-medium">
                                Load In <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="eventLoadIn"
                                value={formData.eventLoadIn}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>

                        {/* Load In Hours */}
                        <div className="space-y-2">
                            <label className="block text-neutral-200 text-sm font-medium">
                                Load In Hours <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="eventLoadInHours"
                                value={formData.eventLoadInHours}
                                onChange={handleInputChange}
                                min="0"
                                step="0.5"
                                maxLength={2}
                                className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>

                        {/* Load Out Section */}
                        <div className="space-y-2">
                            <label className="block text-neutral-200 text-sm font-medium">
                                Load Out <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="eventLoadOut"
                                value={formData.eventLoadOut}
                                onChange={handleInputChange}
                                min={getMinLoadOutDateTime()}
                                className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>

                        {/* Load Out Hours */}
                        <div className="space-y-2">
                            <label className="block text-neutral-200 text-sm font-medium">
                                Load Out Hours <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="eventLoadOutHours"
                                value={formData.eventLoadOutHours}
                                onChange={handleInputChange}
                                min="0"
                                step="0.5"
                                maxLength={2}
                                className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="eventLocation"
                            value={formData.eventLocation}
                            onChange={handleInputChange}
                            maxLength={50}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                            required
                        />
                        <p className="text-xs text-neutral-400">
                            {formData.eventLocation.length}/50 characters
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            name="eventDescription"
                            value={formData.eventDescription}
                            onChange={handleInputChange}
                            maxLength={200}
                            rows="4"
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                        />
                        <p className="text-xs text-neutral-400">
                            {formData.eventDescription.length}/200 characters
                        </p>
                    </div>

                    {/* Contractors */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Contractors
                        </label>
                        <MultiSelect
                            options={contractors.map(contractor => ({
                                value: contractor._id,
                                label: contractor.name
                            }))}
                            value={formData.assignedContractors.map(id => ({
                                value: id,
                                label: contractors.find(c => c._id === id)?.name
                            }))}
                            onChange={(selected) => {
                                setFormData(prev => ({
                                    ...prev,
                                    assignedContractors: selected.map(option => option.value)
                                }));
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => navigate(location.state?.from)}
                            className="px-6 py-2.5 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}