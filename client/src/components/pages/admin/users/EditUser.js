// Edit user page
// Allows Admin to edit user information
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { FaArrowLeft } from "react-icons/fa";

export default function EditUser() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        hourlyRate: "",
        address: "",
        phone: "",
        dob: "",
        shirtSize: "",
        firstAidCert: "",
        allergies: [],
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Fetches user information
                const response = await axios.get(`${process.env.REACT_APP_BACKEND}/users/${id}`);
                setFormData(response.data);
            } catch (error) {
                console.error("Error fetching user:", error);
                toast.error("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Only send the fields that have actually changed
            const updatedFields = {};
            const originalUser = await axios.get(`${process.env.REACT_APP_BACKEND}/users/${id}`);
            
            // Compare each field and only include changed ones
            Object.keys(formData).forEach(key => {
                if (JSON.stringify(formData[key]) !== JSON.stringify(originalUser.data[key])) {
                    updatedFields[key] = formData[key];
                }
            });

            // Only make the API call if there are actual changes
            if (Object.keys(updatedFields).length > 0) {
                // Updates user information
                await axios.put(`${process.env.REACT_APP_BACKEND}/update-user/${id}`, updatedFields);
                toast.success("User updated successfully");
            } else {
                toast.info("No changes were made");
            }
            
            navigate(location.state?.from || "/admin/manage-users");
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
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
                        to="/admin/manage-users"
                        className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-4"
                    >
                        <FaArrowLeft className="w-4 h-4 mr-2" />
                        <span className="text-sm">Back to User Management</span>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Edit User</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-neutral-800 rounded-lg shadow-xl p-6 md:p-8 space-y-8">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Hourly Rate */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Hourly Rate
                        </label>
                        <input
                            type="number"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Phone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    {/* T-Shirt Size */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            T-Shirt Size
                        </label>
                        <select
                            name="shirtSize"
                            value={formData.shirtSize}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        >
                            <option value="">Select size</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="2XL">2XL</option>
                        </select>
                    </div>

                    {/* First Aid Certification */}
                    <div className="space-y-2">
                        <label className="block text-neutral-200 text-sm font-medium">
                            First Aid Certification
                        </label>
                        <input
                            type="text"
                            name="firstAidCert"
                            value={formData.firstAidCert}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-neutral-700 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => navigate(location.state?.from || "/admin/manage-users")}
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