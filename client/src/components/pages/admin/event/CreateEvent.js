// Admin Create Event Page
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserPlus } from 'react-icons/fa';
import MultiSelect from './MultiSelect';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';

export default function CreateEvent() {
    const navigate = useNavigate();
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
    const [showContractorPopup, setShowContractorPopup] = useState(false);
    const [contractors, setContractors] = useState([]);
    const [selectedContractors, setSelectedContractors] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND}/users`)
            .then(response => setContractors(response.data.filter(user => user.status === 'active')))
            .catch(error => console.error('Error fetching contractors:', error));
    }, []);

    // Get current date-time in ISO format
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    // Calculate minimum load out time based on load in
    const getMinLoadOutDateTime = () => {
        if (!formData.eventLoadIn) return getCurrentDateTime();
        return formData.eventLoadIn;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for load in date changes
        if (name === 'eventLoadIn') {
            setFormData(prev => {
                // If load out is before new load in, reset load out
                if (prev.eventLoadOut && new Date(prev.eventLoadOut) < new Date(value)) {
                    toast.error('Load in cannot be after load out time, load in time has been reset.');
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

    const handleContractorChange = (selectedOptions) => {
        setSelectedContractors(selectedOptions.map(option => option.value));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.eventLoadIn === formData.eventLoadOut) {
            toast.error('Load In and Load Out times cannot be the same.');
            setLoading(false);
            return;
        }

        if (new Date(formData.eventLoadIn) > new Date(formData.eventLoadOut)) {
            toast.error('Load In time cannot be after Load Out time.');
            setLoading(false);
            return;
        }
        
        const updatedFormData = { ...formData, assignedContractors: selectedContractors };
        
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/create-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFormData),
            });
            const result = await response.json();

            if (response.ok) {
                setMessage('Event created successfully!');
                setFormData({
                    eventName: '',
                    eventLoadIn: '',
                    eventLoadInHours: '',
                    eventLoadOut: '',
                    eventLoadOutHours: '',
                    eventLocation: '',
                    eventDescription: '',
                    assignedContractors: []
                });
                setSelectedContractors([]);
                toast.success('Event created successfully!');
                navigate('/admin/manage-events');
            } else {
                setMessage(result.message || 'Error creating event');
                toast.error(result.message || 'Error creating event');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('Server error, please try again later');
            toast.error('Server error, please try again later');
        }

        setLoading(false);
    };

    return (
        <div className="w-full h-full overflow-auto flex flex-col p-4 md:p-8 bg-neutral-900">
            <Link 
                to="/admin/manage-events"
                className="mb-4 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors"
            >
                <svg 
                    className="w-4 h-4 md:w-5 md:h-5 mr-2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm md:text-base">Return to Manage Events</span>
            </Link>

            <div className="flex flex-col items-center w-full">
                <div className="w-full max-w-3xl">
                    <h1 className="text-white text-xl md:text-2xl mb-6 md:mb-10">Create New Event</h1>
                    <div className="w-full max-w-3xl border border-neutral-700 rounded-lg p-4 md:p-8 bg-neutral-800/50 backdrop-blur-sm shadow-lg">
                        <form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Event Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="text"
                                        name="eventName"
                                        placeholder="Enter Event Name"
                                        value={formData.eventName}
                                        onChange={handleInputChange}
                                        maxLength={40}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3 mb-4 md:mb-0 md:w-1/2">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Load In <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="datetime-local"
                                        name="eventLoadIn"
                                        value={formData.eventLoadIn}
                                        onChange={handleInputChange}
                                        min={getCurrentDateTime()}
                                        required
                                    />
                                </div>
                                <div className="w-full px-2 md:px-3 md:w-1/2">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Load In Hours <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="number"
                                        name="eventLoadInHours"
                                        value={formData.eventLoadInHours}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="0.5"
                                        maxLength={2}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3 mb-4 md:mb-0 md:w-1/2">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Load Out <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="datetime-local"
                                        name="eventLoadOut"
                                        value={formData.eventLoadOut}
                                        onChange={handleInputChange}
                                        min={getMinLoadOutDateTime()}
                                        required
                                    />
                                </div>
                                <div className="w-full px-2 md:px-3 md:w-1/2">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Load Out Hours <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="number"
                                        name="eventLoadOutHours"
                                        value={formData.eventLoadOutHours}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="0.5"
                                        maxLength={2}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Contractors
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowContractorPopup(true)}
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 text-white bg-neutral-700 hover:bg-neutral-600 text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 flex items-center justify-center transition-colors"
                                    >
                                        Select Contractors <FaUserPlus className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        type="text"
                                        name="eventLocation"
                                        placeholder="Enter Event Location"
                                        value={formData.eventLocation}
                                        onChange={handleInputChange}
                                        maxLength={50}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap -mx-2 md:-mx-3 mb-4 md:mb-6">
                                <div className="w-full px-2 md:px-3">
                                    <label className="block text-neutral-200 text-base md:text-lg font-bold mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        className="appearance-none border border-neutral-600 rounded w-full py-2.5 md:py-3 px-3 md:px-4 bg-neutral-700 text-white text-sm md:text-lg leading-tight focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
                                        name="eventDescription"
                                        placeholder="Enter Job Description"
                                        rows="4"
                                        value={formData.eventDescription}
                                        onChange={handleInputChange}
                                        maxLength={200}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center pt-2 md:pt-4">
                                <HoverBorderGradient
                                    containerClassName="rounded-full w-full md:w-auto"
                                    className="dark:bg-black bg-neutral-900 text-white flex items-center justify-center space-x-2 px-6 md:px-8 py-2.5 w-full md:w-auto text-sm md:text-base"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <svg
                                                className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white mr-2"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v8z"
                                                ></path>
                                            </svg>
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        'Create Event'
                                    )}
                                </HoverBorderGradient>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* {message && <p className="text-green-500 mt-6 text-lg">{message}</p>} */}
            {showContractorPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-neutral-900 p-4 md:p-8 rounded-lg shadow-lg w-full md:w-[80%] max-w-md relative border border-neutral-700">
                        <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 text-center">Select Contractors</h2>
                        <MultiSelect
                            options={contractors.map(contractor => ({
                                value: contractor._id,
                                label: contractor.name
                            }))}
                            value={selectedContractors.map(id => ({
                                value: id,
                                label: contractors.find(contractor => contractor._id === id)?.name
                            }))}
                            onChange={handleContractorChange}
                            isMulti
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            className="text-neutral-900"
                        />
                        <div className="flex justify-center mt-4 md:mt-6">
                            <button
                                onClick={() => setShowContractorPopup(false)}
                                className="w-full md:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm md:text-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
