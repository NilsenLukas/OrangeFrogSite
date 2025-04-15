import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HoverBorderGradient } from '../../../ui/hover-border-gradient';
import { AuthContext } from "../../../../AuthContext";
import { FaTh, FaList, FaRegSadTear, FaSort, FaSearch, FaFilter, FaSortUp, FaSortDown, FaArrowLeft } from 'react-icons/fa';
import { HoverEffect } from "../../../ui/card-hover-effect";
import { motion, AnimatePresence } from "framer-motion";

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-sm sm:text-base text-neutral-400">Loading reports...</p>
    </div>
);

const CorrectionReport = () => {
  const { auth } = useContext(AuthContext); // Get user authentication context
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const eventIDFromURL = queryParams.get('eventID');
  const [formData, setFormData] = useState({
    correctionName: "",
    eventID: eventIDFromURL || '',
    userID: '',
    requestType: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState(null);
  const [reports, setReports] = useState([]);
  const [isGridView, setIsGridView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    // Fetch events
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND}/events/contractor/corrections/${auth.email}`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    // Fetch user by email from AuthContext
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND}/user-profile/${auth.email}`);
        setFormData((prevData) => ({
          ...prevData,
          userID: response.data._id, // Set user's ID in formData
        }));
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to fetch user details.');
      }
    };

    fetchUser();
    fetchEvents();
  }, [auth?.email]);

  useEffect(() => {
    if (eventIDFromURL) {
      setFormData((prevData) => ({
        ...prevData,
        eventID: eventIDFromURL,
      }));
    }
  }, [eventIDFromURL]);

  useEffect(() => {
    if (auth.email) {
      const fetchReports = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`${process.env.REACT_APP_BACKEND}/reports/contractor/${auth.email}`);
          if (response.ok) {
            const data = await response.json();
            setReports(data);
          }
        } catch (error) {
          console.error("Error fetching reports:", error);
          toast.error("Error fetching reports");
        } finally {
          setIsLoading(false);
        }
      };

      fetchReports();
    }
  }, [auth.email]);

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
      await axios.post(
        `${process.env.REACT_APP_BACKEND}/correction-report`,
        formattedData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      toast.success('Correction report submitted successfully.');
      
      navigate('/user/manage-corrections');
    } catch (error) {
      console.error('Error submitting correction report:', error);
      toast.error('Failed to submit correction report.');
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

  const sortedReports = React.useMemo(() => {
    let sortedArray = [...reports];
    if (sortConfig.key) {
      sortedArray.sort((a, b) => {
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
    return sortedArray;
  }, [reports, sortConfig]);

  const getFilteredReports = () => {
    return sortedReports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const formatReportsForHoverEffect = (reports) => {
    return reports.map((report) => ({
      title: (
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">{report.title}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
            report.status === 'approved' ? 'bg-green-500/10 text-green-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        </div>
      ),
      description: (
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-neutral-400 font-medium">Description:</p>
            <p className="text-white line-clamp-3">{report.description}</p>
          </div>
          <div className="space-y-2">
            <p className="text-neutral-400 font-medium">Date:</p>
            <p className="text-white">{new Date(report.date).toLocaleString()}</p>
          </div>
        </div>
      ),
      link: `/user/reports/${report._id}`,
    }));
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
        <div className="flex items-center gap-2">
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
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-full transition-colors ${
              isGridView 
                ? 'bg-neutral-700 text-white' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaTh className="text-lg sm:text-xl" />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-full transition-colors ${
              !isGridView 
                ? 'bg-neutral-700 text-white' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <FaList className="text-lg sm:text-xl" />
          </button>
        </div>
      </div>

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
                  placeholder="Search by title"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 pr-10 py-2 rounded-full bg-white/10 text-white placeholder:text-white/50 outline-none transition-all duration-300 border border-white/20 focus:border-white/40"
                />
                <FaSearch className="absolute right-3 text-white/50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 p-4 bg-neutral-800 rounded-lg">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
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
                  onClick={() => handleSort('title')}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Title
                </button>
                <button
                  onClick={() => handleSort('date')}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Date
                </button>
                <button
                  onClick={() => handleSort('status')}
                  className="px-3 sm:px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm sm:text-base"
                >
                  Status
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

      {/* Filter Summary */}
      <div className="mb-4 text-xs sm:text-sm text-neutral-400">
        Showing {statusFilter === 'all' ? 'all' : statusFilter} reports
        {searchTerm && ` • Search: "${searchTerm}"`}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {isLoading ? (
          <LoadingSpinner />
        ) : getFilteredReports().length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center flex-1 min-h-[300px] sm:min-h-[400px] text-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaRegSadTear className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-300 mb-2">
              No Reports Found
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 max-w-md">
              {searchTerm 
                ? `No reports found matching "${searchTerm}"`
                : statusFilter !== 'all'
                    ? `No ${statusFilter} reports found.`
                    : "No reports available at the moment."}
            </p>
          </motion.div>
        ) : (
          <>
            {isGridView ? (
              <div className="w-full">
                <HoverEffect 
                  items={formatReportsForHoverEffect(getFilteredReports())} 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full bg-neutral-800/50">
                  <thead className="bg-neutral-700">
                    <tr>
                      <th className="p-3 sm:p-4 text-left text-white cursor-pointer" onClick={() => handleSort('title')}>
                        <div className="flex items-center text-sm sm:text-base">
                          Title
                          <span className="ml-2">{getSortIcon('title')}</span>
                        </div>
                      </th>
                      <th className="p-3 sm:p-4 text-left text-white cursor-pointer hidden sm:table-cell" onClick={() => handleSort('date')}>
                        <div className="flex items-center text-sm sm:text-base">
                          Date
                          <span className="ml-2">{getSortIcon('date')}</span>
                        </div>
                      </th>
                      <th className="p-3 sm:p-4 text-left text-white cursor-pointer hidden md:table-cell" onClick={() => handleSort('status')}>
                        <div className="flex items-center text-sm sm:text-base">
                          Status
                          <span className="ml-2">{getSortIcon('status')}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredReports().map((report) => (
                      <tr key={report._id} className="border-t border-neutral-700 hover:bg-neutral-700/50 transition-colors">
                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base">
                          <div className="flex flex-col">
                            <span className="font-medium">{report.title}</span>
                            <span className="text-neutral-400 text-xs sm:hidden">
                              {new Date(report.date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-white text-sm sm:text-base hidden sm:table-cell">
                          {new Date(report.date).toLocaleString()}
                        </td>
                        <td className="p-3 sm:p-4 text-white hidden md:table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                            report.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CorrectionReport;
