import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Papa from 'papaparse';
import { FiUser, FiHash, FiLogIn, FiAlertCircle } from 'react-icons/fi';

const Login = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

    const handleLogin = (e) => {
        e.preventDefault();
        if (!name || !userId) {
            setError('Please enter both Name and ID.');
            return;
        }

        setLoading(true);
        setError('');

        const csvPaths = [
            { path: '/students.csv', role: 'STUDENT' },
            { path: '/advisors.csv', role: 'ADVISOR' },
            { path: '/hod.csv', role: 'HOD' },
            { path: '/lab_incharge.csv', role: 'LAB_INCHARGE' }
        ];

        // Process all CSVs to find the user
        Promise.all(csvPaths.map(p =>
            fetch(p.path).then(res => res.text()).then(text => ({ text, role: p.role }))
        )).then(results => {
            let foundUser = null;

            for (const res of results) {
                const parsed = Papa.parse(res.text, { header: true, skipEmptyLines: true }).data;
                const user = parsed.find(u =>
                    u.name?.trim().toLowerCase() === name.trim().toLowerCase() &&
                    u.id?.trim() === userId.trim()
                );

                if (user) {
                    foundUser = { ...user, role: res.role };
                    break;
                }
            }

            if (foundUser) {
                // Fetch email from maild.csv
                fetch('/maild.csv')
                    .then(res => res.text())
                    .then(mailText => {
                        const emails = Papa.parse(mailText, { header: true, skipEmptyLines: true }).data;
                        const userMail = emails.find(e => e.id?.trim() === foundUser.id?.trim());

                        // Fetch mobile_number.csv
                        return fetch('/mobile_number.csv')
                            .then(resMobile => resMobile.text())
                            .then(mobileText => {
                                const mobiles = Papa.parse(mobileText, { header: true, skipEmptyLines: true }).data;
                                const userMobile = mobiles.find(m => m.id?.trim() === foundUser.id?.trim());

                                const completeUser = {
                                    ...foundUser,
                                    email: userMail?.email || 'N/A',
                                    mobile_number: userMobile?.mobile_number || 'N/A'
                                };
                                localStorage.setItem('user', JSON.stringify(completeUser));
                                onLogin(completeUser);

                                if (completeUser.role === 'STUDENT') {
                                    history.push('/');
                                } else {
                                    history.push('/admin');
                                }
                                setLoading(false);
                            });
                    })
                    .catch(() => {
                        // Fallback if either mail or mobile fails
                        localStorage.setItem('user', JSON.stringify(foundUser));
                        onLogin(foundUser);
                        if (foundUser.role === 'STUDENT') {
                            history.push('/');
                        } else {
                            history.push('/admin');
                        }
                        setLoading(false);
                    });
            } else {
                setError('Invalid Credentials. Please check Name and ID.');
                setLoading(false);
            }
        }).catch(err => {
            setError('Connection error. Please try again later.');
            setLoading(false);
        });
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-[120px]"></div>

            <div className="max-w-md w-full bg-[#141417] rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] border border-white/5 p-12 relative z-10 backdrop-blur-3xl animate-fade-in">
                <div className="text-center mb-12">
                    <div className="h-20 flex justify-center mb-8 mx-auto">
                        <img src="/new_logo_transparent.png" alt="CIT Logo" className="h-full w-auto object-contain" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">Management Portal</h2>
                    <p className="text-gray-500 mt-3 text-sm font-medium tracking-wide font-sans">Unified Access for the Academic Grid</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-1">Full Identity Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                <FiUser size={20} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-[#0a0a0b] text-white placeholder-gray-600 transition-all outline-none font-bold text-lg shadow-inner"
                                placeholder="Enter full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 ml-1">Secure Personnel ID</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                <FiHash size={20} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-[#0a0a0b] text-white placeholder-gray-600 transition-all outline-none font-bold text-lg shadow-inner"
                                placeholder="Student or Staff ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center space-x-3 text-red-400 bg-red-500/5 p-4 rounded-2xl text-sm font-bold border border-red-500/20 animate-shake">
                            <FiAlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-5 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-900/40 transition-all transform active:scale-[0.97] mt-4"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <FiLogIn className="mr-3" size={18} />
                                Initialize Session
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center bg-white/[0.02] rounded-2xl p-6 border border-white/5 shadow-inner">
                    <p className="text-[11px] text-gray-600 leading-relaxed font-bold tracking-tight">
                        BY ACCESSING THIS TERMINAL, YOU AGREE TO SYSTEM PROTOCOLS AND REAL-TIME LOCATION MONITORING.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
