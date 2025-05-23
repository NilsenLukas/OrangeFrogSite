// Admin View/Manage Users Page
// Allows Admins to view and manage users such as creating new user, editing user information, and deleting users
import React, { useState, useEffect, useRef } from 'react';
import { FaTh, FaList, FaEdit, FaSort, FaTrashAlt, FaSortUp, FaSortDown, FaEnvelope, FaSortAlphaDown, FaSortAlphaUp, FaSearch } from 'react-icons/fa';
import autoAnimate from '@formkit/auto-animate';
import axios from 'axios';
import { toast } from 'sonner';
import Modal from "../../../Modal"; 
import { HoverEffect } from "../../../ui/card-hover-effect";
import CreateUsers from './CreateUsers';
import { useNavigate } from 'react-router-dom';

const ConfirmationPopup = ({ user, onConfirm, onCancel }) => (
    <Modal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900/90 p-4 md:p-8 rounded-lg shadow-lg w-full max-w-md border border-neutral-700/50">
                <h2 className="text-red-500 text-xl md:text-2xl mb-4">
                    Are you sure you want to delete {user.name}?
                </h2>
                <p className="text-neutral-300 text-sm md:text-base mb-6">
                    This action cannot be undone. Once deleted, {user.name}'s data will be permanently removed from the system.
                </p>
                <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-4">
                    <button 
                        onClick={onCancel} 
                        className="w-full md:w-auto px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm md:text-base rounded-full transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm md:text-base rounded-full transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </Modal>
);

export default function ViewUsers() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isGridView, setIsGridView] = useState(true);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [searchText, setSearchText] = useState(""); 

    const formParent = useRef(null);

    useEffect(() => {
        formParent.current && autoAnimate(formParent.current);
        fetchUsers();
    }, [formParent]);

    const fetchUsers = async () => {
        try {
            // Fetches users
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/users`);
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error('Failed to fetch users. Please reload the page.');
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if the current screen size is mobile
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsGridView(true); // Force grid view on mobile
            }
        };
    
        handleResize(); // Call on initial load
        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const handleResendEmail = async (userId) => {
        if (!userId) {
            console.error("User ID is undefined");
            toast.error("Invalid user ID. Cannot resend email.");
            return;
        }
    
        try {
            // Resends creation of account email to user & temp password
            await axios.post(`${process.env.REACT_APP_BACKEND}/resend-email/${userId}`);
            toast.success("Email resent successfully!");
        } catch (error) {
            console.error("Error resending email:", error);
            toast.error("Failed to resend email. Please try again.");
        }
    };

    const handleDelete = (id) => {
        setSelectedUser(id);
        setShowPopup(true);
    };

    const confirmDelete = async () => {
        try {
            // Deletes user
            await axios.delete(`${process.env.REACT_APP_BACKEND}/delete-user/${selectedUser}`);
            setUsers(users.filter(user => user._id !== selectedUser));
            setShowPopup(false);
            toast.success('User deleted successfully!');
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error('Failed to delete user. Please try again.');
        }
    };

    const getSortIcon = (key) => {
        if (sortField === key) {
            return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
        }
        return <FaSort />;
    };

    const handleEdit = (user) => {
        navigate(`/admin/users/edit/${user._id}`, { state: { from: '/admin/manage-users' } });
    };

    if (loading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <p className="text-white">Loading Users...</p>
            </div>
        );
    }

    const handleUserClick = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getFilteredAndSortedUsers = () => {
        // Filter users by search text
        const filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchText.toLowerCase())
        );

        // Sort filtered users
        if (!sortField) return filteredUsers;

        return [...filteredUsers].sort((a, b) => {
            // Special handling for hourlyRate
            if (sortField === 'hourlyRate') {
                const aValue = parseFloat(a[sortField]) || 0;
                const bValue = parseFloat(b[sortField]) || 0;
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // For other string fields
            const aValue = String(a[sortField]).toLowerCase();
            const bValue = String(b[sortField]).toLowerCase();

            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    };

    const formatUsersForHoverEffect = (users) => {
        return users.map((user) => ({
            title: (
                <div className="flex justify-between items-center">
                    <span>{user.name}</span>
                    <div className="flex space-x-3">
                        {user.temporaryPassword && ( // Show envelope icon for Pending users
                            <FaEnvelope
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent row click
                                    handleResendEmail(user._id);
                                }}
                                className="text-white-500 cursor-pointer text-xl hover:text-white-600 transition-colors"
                                title="Resend Email"
                            />
                        )}
                        
                        <FaEdit 
                            onClick={(e) => {
                                e.preventDefault();
                                handleEdit(user);
                            }} 
                            className="text-blue-500 cursor-pointer text-xl hover:text-blue-600 transition-colors" 
                            title='Edit User'
                        />
                        <FaTrashAlt 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete(user._id);
                            }} 
                            className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition-colors" 
                            title='Delete User'
                        />
                    </div>
                </div>
            ),
            description: (
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-zinc-400">Email:</span>
                        <span className="truncate max-w-[250px]">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-zinc-400">Hourly Rate:</span>
                        <span>${user.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-zinc-400">Status:</span>
                        <span className={`${user.temporaryPassword ? 'text-yellow-500' : 'text-green-500'}`}>
                            {user.temporaryPassword ? 'Pending' : 'Active'}
                        </span>
                    </div>
                </div>
            ),
            _id: user._id,
            onClick: (e) => {
                if (!e.defaultPrevented) {
                    handleUserClick(user._id);
                }
            }
        }));
    };

    return (
        <div className="w-full h-full overflow-auto px-4 md:px-6">
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-3 mt-5">
                <div className="flex items-center w-full md:w-auto">
                    <div className="relative flex items-center w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search by name"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full md:w-64 px-4 pr-10 py-2 rounded-full bg-white/10 text-white text-sm md:text-base placeholder:text-white/50 outline-none transition-all duration-300 border border-white/20 focus:border-white/40"
                        />
                        <FaSearch className="absolute right-3 text-white/50" />
                    </div>
                </div>

                <div className="flex space-x-2 items-center self-end md:self-auto">
                    <button
                        onClick={() => setIsGridView(true)}
                        className={`p-2 rounded transition-colors ${
                            isGridView 
                                ? 'bg-neutral-700 text-white' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                    >
                        <FaTh className="text-lg md:text-xl" />
                    </button>
                    <button
                        onClick={() => setIsGridView(false)}
                        className={`p-2 rounded transition-colors ${
                            !isGridView 
                                ? 'bg-neutral-700 text-white' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                        }`}
                    >
                        <FaList className="text-lg md:text-xl" />
                    </button>
                </div>
            </div>
            <CreateUsers onUserCreated={fetchUsers} />
            
            {getFilteredAndSortedUsers().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-white/60">
                    <div className="text-4xl md:text-6xl mb-4">😢</div>
                    <p className="text-lg md:text-xl">No users found</p>
                    {searchText && (
                        <p className="text-xs md:text-sm mt-2">
                            Try adjusting your search criteria
                        </p>
                    )}
                </div>
            ) : (
                <section className="w-full flex flex-col items-center mb-10">
                    {isGridView ? (
                        <div className="w-full">
                            <HoverEffect 
                                items={formatUsersForHoverEffect(getFilteredAndSortedUsers())} 
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                            />
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <div className="min-w-[800px]">
                                    <table className="w-full bg-neutral-800/50 rounded-lg overflow-hidden mt-4">
                                        <thead className="bg-neutral-700/80 sticky top-0">
                                            <tr>
                                                <th 
                                                    className="p-4 text-left text-white text-base font-medium cursor-pointer whitespace-nowrap hover:bg-neutral-600/50 transition-colors"
                                                    onClick={() => handleSort('name')}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="mr-2">Name</span>
                                                        <span className="text-neutral-400">{getSortIcon('name')}</span>
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-4 text-left text-white text-base font-medium cursor-pointer whitespace-nowrap hover:bg-neutral-600/50 transition-colors"
                                                    onClick={() => handleSort('email')}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="mr-2">Email</span>
                                                        <span className="text-neutral-400">{getSortIcon('email')}</span>
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-4 text-left text-white text-base font-medium cursor-pointer whitespace-nowrap hover:bg-neutral-600/50 transition-colors"
                                                    onClick={() => handleSort('status')}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="mr-2">Status</span>
                                                        <span className="text-neutral-400">{getSortIcon('status')}</span>
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-4 text-left text-white text-base font-medium cursor-pointer whitespace-nowrap hover:bg-neutral-600/50 transition-colors"
                                                    onClick={() => handleSort('hourlyRate')}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="mr-2">Hourly Rate</span>
                                                        <span className="text-neutral-400">{getSortIcon('hourlyRate')}</span>
                                                    </div>
                                                </th>
                                                <th className="p-4 text-left text-white text-base font-medium whitespace-nowrap w-[140px]">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-700/50">
                                            {getFilteredAndSortedUsers().map((user) => (
                                                <tr 
                                                    key={user._id} 
                                                    className="hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                                    onClick={() => handleUserClick(user._id)}
                                                >
                                                    <td className="p-4 text-white text-base truncate max-w-[200px]">
                                                        <div className="truncate">{user.name}</div>
                                                    </td>
                                                    <td className="p-4 text-white text-base truncate max-w-[250px]">
                                                        <div className="truncate">{user.email}</div>
                                                    </td>
                                                    <td className="p-4 text-base">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                            user.temporaryPassword 
                                                                ? 'bg-yellow-500/20 text-yellow-500' 
                                                                : 'bg-green-500/20 text-green-500'
                                                        }`}>
                                                            {user.temporaryPassword ? 'Pending' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-white text-base">
                                                        <div className="font-medium">${user.hourlyRate}/hr</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-end space-x-4">
                                                            {user.temporaryPassword && (
                                                                <FaEnvelope
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleResendEmail(user._id);
                                                                    }}
                                                                    className="text-white cursor-pointer text-xl hover:text-blue-600 transition-colors"
                                                                    title="Resend Email"
                                                                />
                                                            )}
                                                            <FaEdit 
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent row click
                                                                    handleEdit(user);
                                                                }} 
                                                                className="text-blue-500 cursor-pointer text-xl hover:text-blue-600 transition-colors" 
                                                                title='Edit User'
                                                            />
                                                            <FaTrashAlt 
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent row click
                                                                    handleDelete(user._id);
                                                                }} 
                                                                className="text-red-500 cursor-pointer text-xl hover:text-red-600 transition-colors" 
                                                                title='Delete User'
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 mt-4">
                                {getFilteredAndSortedUsers().map((user) => (
                                    <div 
                                        key={user._id}
                                        className="bg-neutral-800/50 rounded-lg p-4 space-y-3 border border-neutral-700/30"
                                        onClick={() => handleUserClick(user._id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="text-white font-medium">{user.name}</h3>
                                                <p className="text-neutral-400 text-sm truncate max-w-[200px]">{user.email}</p>
                                            </div>
                                            <span className={`${user.temporaryPassword ? 'text-yellow-500' : 'text-green-500'} text-sm`}>
                                                {user.temporaryPassword ? 'Pending' : 'Active'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-white text-sm">${user.hourlyRate}/hr</span>
                                            <div className="flex items-center gap-4">
                                                {user.temporaryPassword && (
                                                    <FaEnvelope 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResendEmail(user._id);
                                                        }}
                                                        className="text-lg text-white cursor-pointer hover:text-blue-400 transition-colors"
                                                        title="Resend Email"
                                                    />
                                                )}
                                                <FaEdit 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(user);
                                                    }}
                                                    className="text-lg text-blue-500 cursor-pointer hover:text-blue-400 transition-colors"
                                                    title="Edit User"
                                                />
                                                <FaTrashAlt 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(user._id);
                                                    }}
                                                    className="text-lg text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                                                    title="Delete User"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {showPopup && selectedUser && (
                <ConfirmationPopup 
                    user={users.find(user => user._id === selectedUser)}
                    onConfirm={confirmDelete} 
                    onCancel={() => setShowPopup(false)} 
                />
            )}
        </div>
    );
}