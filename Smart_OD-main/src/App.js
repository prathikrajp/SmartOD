import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, Redirect, useHistory } from 'react-router-dom';
import Papa from 'papaparse';
import Home from './Home';
import AdminDashboard from './AdminDashboard';
import Rooms from './Rooms';
import ScanCheckin from './ScanCheckin';
import Login from './Login';
import ODStatus from './ODStatus';
import QRCodePortal from './QRCodePortal';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Notifications';
import SystemMonitor from './SystemMonitor';
import { FiLogOut, FiUser, FiCheckCircle, FiMaximize, FiGrid } from 'react-icons/fi';

const ProtectedRoute = ({ component: Component, user, ...rest }) => (
    <Route {...rest} render={(props) => (
        user ? <Component {...props} user={user} /> : <Redirect to="/login" />
    )} />
);

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (!parsedUser.email || parsedUser.email === 'N/A') {
                // Try to fetch email if missing for existing session
                fetch('/maild.csv')
                    .then(res => res.text())
                    .then(mailText => {
                        const emails = Papa.parse(mailText, { header: true, skipEmptyLines: true }).data;
                        const userMail = emails.find(e => e.id?.trim() === parsedUser.id?.trim());
                        if (userMail) {
                            const updatedUser = { ...parsedUser, email: userMail.email };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            setUser(updatedUser);
                        } else {
                            setUser(parsedUser);
                        }
                    })
                    .catch(() => setUser(parsedUser));
            } else {
                setUser(parsedUser);
            }
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <Router>
            <div className="min-h-screen bg-[#0a0a0b] text-white font-['Outfit'] selection:bg-blue-500/30">
                {user && <SystemMonitor />}
                {/* Navigation - Only visible if logged in */}
                {user && (
                    <nav className="bg-[#141417]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 shadow-2xl">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <div className="flex justify-between h-20">
                                <div className="flex items-center">
                                    <div className="h-10 mr-6 flex items-center">
                                        <img src="/new_logo_transparent.png" alt="CIT Logo" className="h-full w-auto object-contain" />
                                    </div>
                                    <span className="text-2xl font-black text-white tracking-[-0.05em] mr-12 group cursor-pointer transition-all">
                                        Smart<span className="text-blue-500">OD</span>
                                        <div className="h-1 w-0 group-hover:w-full bg-blue-500 transition-all duration-500 rounded-full"></div>
                                    </span>
                                    <div className="flex space-x-2">
                                        {user.role === 'STUDENT' ? (
                                            <>
                                                <Link to="/" className="flex items-center px-5 py-2.5 text-xs font-black text-gray-500 hover:text-white rounded-xl transition-all hover:bg-white/5 uppercase tracking-widest leading-none">
                                                    <FiCheckCircle className="mr-3 text-blue-500" size={18} />
                                                    Terminal
                                                </Link>
                                                <Link to="/scan" className="flex items-center px-5 py-2.5 text-xs font-black text-gray-500 hover:text-white rounded-xl transition-all hover:bg-white/5 uppercase tracking-widest leading-none">
                                                    <FiMaximize className="mr-3 text-blue-500" size={18} />
                                                    Scanner
                                                </Link>
                                            </>
                                        ) : (
                                            <Link to="/admin" className="flex items-center px-5 py-2.5 text-xs font-black text-gray-500 hover:text-white rounded-xl transition-all hover:bg-white/5 uppercase tracking-widest leading-none">
                                                <FiCheckCircle className="mr-3 text-blue-500" size={18} />
                                                Dashboard
                                            </Link>
                                        )}
                                        {user && (user.role === 'LAB_INCHARGE' || user.role === 'ADVISOR') && (
                                            <Link to="/qrcode" className="flex items-center px-5 py-2.5 text-xs font-black text-gray-500 hover:text-white rounded-xl transition-all hover:bg-white/5 uppercase tracking-widest leading-none">
                                                <FiGrid className="mr-3 text-blue-500" size={18} />
                                                Portal
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <Notifications user={user} />
                                    <ProfileDropdown user={user} onLogout={handleLogout} />
                                    <button
                                        onClick={handleLogout}
                                        className="p-3 text-gray-400 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-2xl border border-transparent hover:border-red-500/20"
                                        title="Terminate Session"
                                    >
                                        <FiLogOut size={22} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}

                <main className={user ? "max-w-7xl mx-auto py-12 px-6 lg:px-8" : ""}>
                    <Switch>
                        <Route path="/login" render={() => user ? <Redirect to={user.role === 'STUDENT' ? '/' : '/admin'} /> : <Login onLogin={handleLogin} />} />

                        <ProtectedRoute exact path="/" user={user} component={user?.role === 'STUDENT' ? ODStatus : () => <Redirect to="/admin" />} />
                        <ProtectedRoute path="/scan" user={user} component={user?.role === 'STUDENT' ? ScanCheckin : () => <Redirect to="/admin" />} />
                        <ProtectedRoute path="/admin" user={user} component={user?.role !== 'STUDENT' ? AdminDashboard : () => <Redirect to="/" />} />
                        <ProtectedRoute path="/qrcode" user={user} component={(user?.role === 'LAB_INCHARGE' || user?.role === 'ADVISOR') ? QRCodePortal : () => <Redirect to="/admin" />} />

                        <Redirect to={user ? (user.role === 'STUDENT' ? '/' : '/admin') : '/login'} />
                    </Switch>
                </main>
            </div>
        </Router>
    );

}

export default App;
