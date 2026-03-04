import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileCsv as FileSpreadsheet, FaQrcode as QrCode, FaExpand as ScanLine, FaShieldAlt as ShieldCheck, FaLock } from 'react-icons/fa';

const Home = ({ user }) => {
    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-16 animate-fade-in">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                    {user ? (
                        <>Welcome back, <span className="text-blue-600">{user.name}</span></>
                    ) : (
                        <>Smart <span className="text-blue-600">On Duty</span> Management</>
                    )}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {user
                        ? `Your recorded CGPA is ${user.cgpa}. You can now proceed to check-in for your assigned lab sessions.`
                        : "Automated academic priority scheduling and secure location verification for student lab access."
                    }
                </p>
                {!user && (
                    <div className="mt-8">
                        <Link to="/login" className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                            Get Started
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link to="/admin" className="group">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full transition-all duration-300 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1">
                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 text-blue-600">
                            <FileSpreadsheet size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Admin Dashboard</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Upload student academic records (CSV). Automatically rank and prioritize OD requests based on CGPA and recent test marks.
                        </p>
                    </div>
                </Link>

                <Link to="/rooms" className="group">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full transition-all duration-300 hover:shadow-xl hover:border-purple-100 hover:-translate-y-1">
                        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 text-purple-600">
                            <QrCode size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Lab Rooms</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Generate dynamic QR codes for specific classrooms and laboratories to enable secure student check-ins.
                        </p>
                    </div>
                </Link>

                <Link to="/scan" className="group">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-full transition-all duration-300 hover:shadow-xl hover:border-emerald-100 hover:-translate-y-1">
                        <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 text-emerald-600">
                            <ScanLine size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Student Check-in</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Scan room QR codes to verify presence. Integrates simulated MAC address validation to prevent proxy attendance.
                        </p>
                    </div>
                </Link>
            </div>

            <div className="mt-20 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                    <ShieldCheck size={200} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Why Smart OD?</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Merit-based approval prioritizing students with strong academic standing.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Multi-factor location verification ensuring students are in the correct lab.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Streamlined offline CSV processing for maximum privacy and speed.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Home;
