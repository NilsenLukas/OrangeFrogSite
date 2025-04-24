// Admin Edit Correction Report Page
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from "../../../../AuthContext";

const CorrectionReport = () => {
  const { auth } = useContext(AuthContext); // Get user authentication context
  const [formData, setFormData] = useState({
    correctionName: '',
    eventID: '',
    userID: '',
    requestType: '',
    description: '',
  });
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Fetches events
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    // Fetches the correction
    const fetchCorrection = async () => {
      try {
        const correctionRes = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/${id}`);

        console.log("Fetched Correction Data:", correctionRes.data);

        setFormData({
          correctionName: correctionRes.data.correction.correctionName,
          eventID: correctionRes.data.correction.eventID,
          requestType: correctionRes.data.correction.requestType,
          description: correctionRes.data.correction.description,
        }); 

      } catch (error) {
        console.error('Error fetching correction:', error);
        toast.error('Failed to fetch correction details.');
      }
    };

    fetchEvents();
    fetchCorrection();
  }, [auth?.email]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.correctionName || !formData.eventID || !formData.requestType || !formData.description) {
      toast.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const formattedData = {
      ...formData,
    };

    // Create FormData object
    const formDataToSend = new FormData();
    Object.keys(formattedData).forEach(key => {
      formDataToSend.append(key, formattedData[key]);
    });

    if (files) {
      Array.from(files).forEach((file) => formDataToSend.append('files', file));
    }

    try {
      formDataToSend.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      await axios.put(
        `${process.env.REACT_APP_BACKEND}/correction-report/${id}`,
        formattedData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      toast.success('Correction report updated successfully.');
      
      navigate(location.state?.from);
    } catch (error) {
      console.error('Error updating correction report:', error);
      toast.error('Failed to update correction report.');
    } finally {
      setLoading(false);
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
    <div className="flex flex-col items-center w-full min-h-screen p-4 sm:p-8 bg-neutral-900">
      <Link
        to="/admin/manage-corrections"
        className="mb-4 sm:mb-8 flex items-start text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
        Return to Manage Correction Reports
      </Link>

      <div className="w-full max-w-4xl bg-neutral-800 p-4 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 text-center">Edit Correction Report</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Correction Name */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Correction Name</label>
            <input
              type="text"
              name="correctionName"
              value={formData.correctionName}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors text-sm sm:text-base"
              required
            />
          </div>

          {/* Event Selector */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Event</label>
            <select
              name="eventID"
              value={formData.eventID}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors text-sm sm:text-base"
              required
            >
              <option value="">Select an Event</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </div>

          {/* Request Type */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Request Type</label>
            <input
              type="text"
              name="requestType"
              value={formData.requestType}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors text-sm sm:text-base"
              required
            />
          </div>

          {/* Description */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors h-24 sm:h-32 text-sm sm:text-base"
              required
            />
          </div>

          {/* File Upload */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Upload Files</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors text-sm sm:text-base"
            />
          </div>

          {/* Submit Button */}
          <div className="col-span-1 flex flex-col sm:flex-row justify-center gap-4 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => navigate(location.state?.from)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg bg-black text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectionReport;
