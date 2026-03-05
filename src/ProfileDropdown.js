import React, { useState, useRef, useEffect } from 'react';
import { FiCamera } from 'react-icons/fi';

const ProfileDropdown = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [profilePic, setProfilePic] = useState(localStorage.getItem(`profile_pic_${user.id}`) || null);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePic(base64String);
                localStorage.setItem(`profile_pic_${user.id}`, base64String);
                setShowPhotoOptions(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePhoto = () => {
        setProfilePic(null);
        localStorage.removeItem(`profile_pic_${user.id}`);
        setShowPhotoOptions(false);
    };

    const renderRoleInfo = () => {
        const fields = [];
        switch (user.role) {
            case 'STUDENT':
                fields.push(
                    { label: 'Name', value: user.name },
                    { label: 'Department', value: user.department },
                    { label: 'Year of Study', value: user.yearOfStudy },
                    { label: 'Classroom', value: user.className }
                );
                break;
            case 'ADVISOR':
                fields.push(
                    { label: 'Name', value: user.name },
                    { label: 'Department', value: user.department },
                    { label: 'Classroom', value: user.className },
                    { label: 'Mobile Number', value: user.mobile_number }
                );
                break;
            case 'LAB_INCHARGE':
                fields.push(
                    { label: 'Name', value: user.name },
                    { label: 'Lab Name', value: user.labName },
                    { label: 'Mobile Number', value: user.mobile_number }
                );
                break;
            case 'HOD':
                fields.push(
                    { label: 'Name', value: user.name },
                    { label: 'Department', value: user.department },
                    { label: 'Mobile Number', value: user.mobile_number }
                );
                break;
            default:
                break;
        }

        return (
            <div className="space-y-4">
                {fields.map((f, i) => (
                    <InfoItem key={i} label={f.label} value={f.value} />
                ))}
            </div>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 p-1 rounded-full hover:bg-white/5 transition-all focus:outline-none border-2 border-transparent hover:border-blue-500/20 group"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-black overflow-hidden shadow-lg transform group-hover:scale-105 transition-all">
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        user.name.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="hidden md:flex flex-col items-start mr-2">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">{user.role}</span>
                    <span className="text-xs font-bold text-white leading-none tracking-tight">{user.name}</span>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-5 w-80 bg-[#141417]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/5 py-8 px-8 z-[100]">
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="relative group mb-4">
                            <div
                                className="w-24 h-24 rounded-[2rem] bg-blue-500/10 border-4 border-white/5 shadow-inner flex items-center justify-center text-4xl font-black text-blue-500 overflow-hidden cursor-pointer"
                                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                            >
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile Large" className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <button
                                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                                className="absolute -bottom-1 -right-1 bg-white text-black p-2.5 rounded-xl shadow-2xl hover:bg-blue-500 hover:text-white transition-all border border-white/10"
                                title="Photo Options"
                            >
                                <FiCamera size={14} />
                            </button>

                            {showPhotoOptions && (
                                <div className="absolute top-24 mt-2 left-1/2 -translate-x-1/2 bg-[#2a2a2e] rounded-xl shadow-2xl overflow-hidden z-[200] w-40 flex flex-col border border-white/10">
                                    <button
                                        onClick={() => {
                                            fileInputRef.current.click();
                                        }}
                                        className="px-4 py-2 text-sm text-center hover:bg-white/10 text-white font-semibold transition-colors"
                                    >
                                        {profilePic ? 'Update Photo' : 'Add Photo'}
                                    </button>
                                    {profilePic && (
                                        <button
                                            onClick={handleDeletePhoto}
                                            className="px-4 py-2 text-sm text-center hover:bg-red-500/20 text-red-500 font-semibold transition-colors border-t border-white/5"
                                        >
                                            Delete Photo
                                        </button>
                                    )}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h3 className="text-xl font-black text-white leading-tight tracking-tight">{user.name}</h3>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2 bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">
                            {user.role.replace('_', ' ')}
                        </p>
                    </div>

                    <div className="border-t border-white/5 pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Profile Details</h4>
                        </div>
                        {renderRoleInfo()}
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">{label}</span>
        <span className="text-sm font-bold text-white leading-tight tracking-tight px-1">{value || 'N/A'}</span>
    </div>
);

export default ProfileDropdown;
