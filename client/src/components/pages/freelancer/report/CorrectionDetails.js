import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../../../../AuthContext";
import { toast } from "sonner";
import { FaArrowLeft, FaEdit, FaTrash, FaFileAlt, FaDownload } from 'react-icons/fa';
import { motion } from "framer-motion";

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

const CorrectionDetails = () => {
    const { id } = useParams();
    const { auth } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${process.env.REACT_APP_BACKEND}/reports/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setReport(data);
                } else {
                    toast.error("Failed to fetch report details");
                }
            } catch (error) {
                console.error("Error fetching report:", error);
                toast.error("Error fetching report details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id]);

    const handleDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/reports/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast.success("Report deleted successfully");
                window.location.href = "/user/reports";
            } else {
                toast.error("Failed to delete report");
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            toast.error("Error deleting report");
        }
    };

    const downloadFile = async (fileId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND}/files/${fileId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `file-${fileId}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error("Failed to download file");
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Error downloading file");
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] text-center p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-neutral-300 mb-2">
                    Report Not Found
                </h2>
                <p className="text-sm sm:text-base text-neutral-400 max-w-md">
                    The requested report could not be found.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen h-full p-4 sm:p-6 md:p-8 bg-neutral-900">
            <Link 
                to="/user/reports"
                className="mb-4 sm:mb-6 md:mb-8 flex items-center text-neutral-400 hover:text-white transition-colors text-sm sm:text-base"
            >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Return to Reports
            </Link>

            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-neutral-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-0">
                            {report.title}
                        </h1>
                        <div className="flex gap-2">
                            <Link
                                to={`/user/reports/${id}/edit`}
                                className="p-2 rounded-full bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                            >
                                <FaEdit className="text-lg sm:text-xl" />
                            </Link>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                            >
                                <FaTrash className="text-lg sm:text-xl" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-sm sm:text-base font-medium text-neutral-400 mb-2">Status</h2>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                report.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                report.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-medium text-neutral-400 mb-2">Date</h2>
                            <p className="text-white text-sm sm:text-base">
                                {new Date(report.date).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-sm sm:text-base font-medium text-neutral-400 mb-2">Description</h2>
                        <p className="text-white text-sm sm:text-base whitespace-pre-wrap">
                            {report.description}
                        </p>
                    </div>

                    {report.files && report.files.length > 0 && (
                        <div>
                            <h2 className="text-sm sm:text-base font-medium text-neutral-400 mb-4">Attached Files</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {report.files.map((file) => (
                                    <div
                                        key={file._id}
                                        className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FaFileAlt className="text-neutral-400" />
                                            <span className="text-white text-sm truncate max-w-[200px]">
                                                {file.originalName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => downloadFile(file._id)}
                                            className="p-2 rounded-full bg-neutral-600 text-white hover:bg-neutral-500 transition-colors"
                                        >
                                            <FaDownload className="text-sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
                            Confirm Deletion
                        </h3>
                        <p className="text-neutral-400 mb-6">
                            Are you sure you want to delete this report? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CorrectionDetails;