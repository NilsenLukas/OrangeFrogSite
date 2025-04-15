import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import MultiSelect from './MultiSelect'; // Import MultiSelect if needed

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get user ID from URL
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/users/email/${id}`);
        setFormData(response.data);
      } catch (error) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/update-user/${id}`, formData);
      toast.success("User updated successfully");
      navigate("/admin/manage-users");
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-900">
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Edit User</h1>
            <button
              type="button"
              onClick={() => navigate("/admin/manage-users")}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-neutral-700 text-white text-sm md:text-base rounded-lg hover:bg-neutral-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-neutral-800 rounded-lg shadow-xl p-4 md:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    T-Shirt Size
                  </label>
                  <select
                    name="shirtSize"
                    value={formData.shirtSize}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="">Select Size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-200 text-sm md:text-lg font-medium mb-2">
                    First Aid Certification
                  </label>
                  <input
                    type="text"
                    name="firstAidCert"
                    value={formData.firstAidCert}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg bg-neutral-700 border border-neutral-600 text-white text-sm md:text-base placeholder-neutral-400 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 pt-6 border-t border-neutral-700">
                <button
                  type="button"
                  onClick={() => navigate("/admin/manage-users")}
                  className="w-full md:w-auto px-4 py-2 bg-neutral-700 text-white text-sm md:text-base rounded-lg hover:bg-neutral-600 transition-colors order-2 md:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-4 py-2 bg-black text-white text-sm md:text-base rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed order-1 md:order-2"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 