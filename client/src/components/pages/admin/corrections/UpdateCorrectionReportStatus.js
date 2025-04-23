import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
// import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { AuthContext } from "../../../../AuthContext";

const CorrectionReport = () => {
  const { auth } = useContext(AuthContext); // Get user authentication context
  const [formData, setFormData] = useState({
    status: '',
    additionalComments: '',
  });
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  // const [events, setEvents] = useState([]);
  const [files] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Fetches the correction
    const fetchCorrection = async () => {
      try {
        const correctionRes = await axios.get(`${process.env.REACT_APP_BACKEND}/corrections/${id}`);

        console.log("Fetched Correction Data:", correctionRes.data);

        setFormData({
          status: correctionRes.data.correction.status,
          additionalComments: correctionRes.data.correction.additionalComments,
        }); 

      } catch (error) {
        console.error('Error fetching correction:', error);
        toast.error('Failed to fetch correction details.');
      }
    };

    fetchCorrection();
  }, [auth?.email]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.status) {
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
      
      toast.success('Correction report status updated successfully.');
      
      navigate(location.state?.from);
    } catch (error) {
      console.error('Error updating correction report status:', error);
      toast.error('Failed to update correction report status.');
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
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 text-center">Update Correction Status</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Status Selector */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors text-sm sm:text-base"
              required
            >
                <option value="Pending">Pending</option>
                <option value="Declined">Received</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
            </select>
          </div>

          {/* Additional Comments */}
          <div className="col-span-1">
            <label className="block text-white mb-2 text-sm sm:text-base">Additional Comments</label>
            <textarea
              name="additionalComments"
              value={formData.additionalComments}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 bg-neutral-700 text-white rounded-lg border border-neutral-600 focus:outline-none focus:border-orange-500 transition-colors h-24 sm:h-32 text-sm sm:text-base"
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
