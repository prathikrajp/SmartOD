import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { FiUploadCloud as UploadCloud, FiCheckCircle as CheckCircle2, FiXCircle as XCircle, FiAlertCircle as AlertCircle, FiUser as User, FiMapPin as MapPin, FiMaximize as Maximize, FiClock as Clock } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = ({ user }) => {
    const [data, setData] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [globalRequests, setGlobalRequests] = useState([]);
    const [approvedODs, setApprovedODs] = useState({}); // studentId -> labName map
    const [locationMap, setLocationMap] = useState({}); // locationName -> {floor, bssid}
    const [livePresence, setLivePresence] = useState({});
    const [error, setError] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [studentMetadata, setStudentMetadata] = useState({}); // studentId -> {achievements, remarks}
    const [editingStudent, setEditingStudent] = useState(null); // id of student being edited
    const [editForm, setEditForm] = useState({ achievements: '', remarks: '' });

    useEffect(() => {
        // 0. Load MAC and Location Data
        fetch('/MAC_address.csv')
            .then(res => res.text())
            .then(csv => {
                const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
                const mapping = {};
                parsed.forEach(row => {
                    mapping[row.className] = {
                        floor: row.floor,
                        bssid: row.bssid
                    };
                });
                setLocationMap(mapping);
            });

        // 1. Load pending requests from global store
        const reqs = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
        setGlobalRequests(reqs);

        // Role-based filtering for requests
        let filteredReqs = [];
        if (user.role === 'LAB_INCHARGE') {
            filteredReqs = reqs.filter(r => r.labName === user.labName && r.status === 'PENDING_LAB');
        } else if (user.role === 'ADVISOR') {
            filteredReqs = reqs.filter(r => r.className === user.className && r.status === 'PENDING_ADVISOR');
        } else if (user.role === 'HOD') {
            filteredReqs = reqs.filter(r => r.department === user.department && r.status === 'FORWARDED_TO_HOD');
        }
        setPendingRequests(filteredReqs);

        // 2. Automated Academic Data Loading (for Advisors and HODs)
        if (user.role !== 'LAB_INCHARGE') {
            fetch('/students.csv')
                .then(r => r.text())
                .then(csv => {
                    // Load metadata first to ensure it's available for merging
                    const savedMetadata = JSON.parse(localStorage.getItem('student_metadata') || '{}');
                    setStudentMetadata(savedMetadata);

                    Papa.parse(csv, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            const parsed = results.data.map(s => ({
                                ...s,
                                cgpa: parseFloat(s.cgpa) || 0,
                                marks: parseFloat(s.marks) || 0,
                                priorityScore: (parseFloat(s.cgpa) * 6) + (parseFloat(s.marks) * 0.4),
                                approved: ((parseFloat(s.cgpa) * 6) + (parseFloat(s.marks) * 0.4)) > 60
                            }));

                            // Filter for this specific faculty's scope
                            let filteredStudents = [];
                            if (user.role === 'ADVISOR') {
                                filteredStudents = parsed.filter(s => s.className === user.className);
                            } else if (user.role === 'HOD') {
                                filteredStudents = parsed.filter(s => s.department === user.department);
                            }

                            filteredStudents.sort((a, b) => b.priorityScore - a.priorityScore);

                            // Merge with metadata for the list display
                            const mergedWithMetadata = filteredStudents.map(s => ({
                                ...s,
                                achievements: savedMetadata[s.id]?.achievements || s.achievements || 'N/A',
                                remarks: savedMetadata[s.id]?.remarks || s.remarks || 'N/A'
                            }));

                            setData(mergedWithMetadata);
                        }
                    });
                });
        }
        // 3. Load live presence and approved OD map
        const updatePresence = () => {
            const presence = JSON.parse(localStorage.getItem('live_presence') || '{}');
            setLivePresence(presence);

            const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
            const approvedMap = {};
            allRequests.forEach(r => {
                if (r.status === 'APPROVED') {
                    approvedMap[r.studentId] = r.labName;
                }
            });
            setApprovedODs(approvedMap);
        };
        updatePresence();
        const interval = setInterval(updatePresence, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, [user]);


    const updateRequestStatus = (requestId, studentId, newStatus) => {
        const isApprovedNow = newStatus === 'APPROVED';
        const approvalTimestamp = isApprovedNow ? Date.now() : null;

        // 1. Update Global Store
        const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
        const updatedGlobal = allRequests.map(r => r.id === requestId ? { ...r, status: newStatus, ...(isApprovedNow && { approvedAt: approvalTimestamp, timeoutTriggered: false }) } : r);
        localStorage.setItem('all_od_requests', JSON.stringify(updatedGlobal));

        // 2. Update Student's Personal History
        const studentHistory = JSON.parse(localStorage.getItem(`od_requests_${studentId}`) || '[]');
        const updatedHistory = studentHistory.map(r => r.id === requestId ? { ...r, status: newStatus, ...(isApprovedNow && { approvedAt: approvalTimestamp, timeoutTriggered: false }) } : r);
        localStorage.setItem(`od_requests_${studentId}`, JSON.stringify(updatedHistory));

        // 3. Refresh Local View
        setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
    };

    const handleApprove = (req) => {
        let nextStatus = 'DENIED';
        if (req.status === 'PENDING_LAB') {
            nextStatus = 'PENDING_ADVISOR';
        } else if (req.status === 'PENDING_ADVISOR') {
            // After Advisor, check if auto-approved by HOD or needs manual HOD
            // Use 75 as the threshold for "High Performer" auto-approval
            nextStatus = req.priorityScore >= 75 ? 'APPROVED' : 'FORWARDED_TO_HOD';
        } else if (req.status === 'FORWARDED_TO_HOD') {
            nextStatus = 'APPROVED';
        }
        updateRequestStatus(req.id, req.studentId, nextStatus);
    };

    const handleDeny = (req) => {
        // Track which stage rejected the request
        const getRejectedBy = (status) => {
            if (status === 'PENDING_LAB') return 'LAB_INCHARGE';
            if (status === 'PENDING_ADVISOR') return 'ADVISOR';
            if (status === 'FORWARDED_TO_HOD') return 'HOD';
            return 'LAB_INCHARGE';
        };

        // 1. Update Global Store with rejectedBy field
        const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
        const updatedGlobal = allRequests.map(r => r.id === req.id ? { ...r, status: 'DENIED', rejectedBy: getRejectedBy(req.status) } : r);
        localStorage.setItem('all_od_requests', JSON.stringify(updatedGlobal));

        // 2. Update Student's Personal History with rejectedBy field
        const studentHistory = JSON.parse(localStorage.getItem(`od_requests_${req.studentId}`) || '[]');
        const updatedHistory = studentHistory.map(r => r.id === req.id ? { ...r, status: 'DENIED', rejectedBy: getRejectedBy(req.status) } : r);
        localStorage.setItem(`od_requests_${req.studentId}`, JSON.stringify(updatedHistory));

        // 3. Refresh Local View
        setPendingRequests(pendingRequests.filter(r => r.id !== req.id));
    };

    const handleSaveMetadata = () => {
        const updatedMetadata = {
            ...studentMetadata,
            [editingStudent]: editForm
        };
        setStudentMetadata(updatedMetadata);
        localStorage.setItem('student_metadata', JSON.stringify(updatedMetadata));

        // Update local data list too
        setData(data.map(s => s.id === editingStudent ? { ...s, ...editForm } : s));
        setEditingStudent(null);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is CSV
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a valid .csv file.');
            return;
        }
        setError('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data.map(student => {
                    const cgpa = parseFloat(student.cgpa) || 0;
                    const marks = parseFloat(student.marks) || 0;
                    const score = (cgpa * 10 * 0.6) + (marks * 0.4);

                    return {
                        ...student,
                        cgpa,
                        marks,
                        priorityScore: score,
                        approved: score > 60
                    };
                });

                // Filter by class if Advisor
                const filteredByRole = user.role === 'ADVISOR'
                    ? parsed.filter(s => s.className === user.className)
                    : parsed;

                filteredByRole.sort((a, b) => b.priorityScore - a.priorityScore);
                setData(filteredByRole);
            },
            error: (err) => {
                setError('Error parsing CSV: ' + err.message);
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">Management Dashboard</h2>
                    <p className="text-gray-400 mt-2 font-medium">
                        Welcome, <span className="text-blue-400 font-bold">{user?.name}</span>
                        <span className="ml-3 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {user?.department && (
                            <span className="bg-white/5 text-gray-300 text-xs font-bold px-4 py-1.5 rounded-full border border-white/10 flex items-center shadow-sm">
                                <span className="mr-2">🏢</span> {user.department}
                            </span>
                        )}
                        {user?.className && user?.role === 'ADVISOR' && (
                            <span className="bg-white/5 text-gray-300 text-xs font-bold px-4 py-1.5 rounded-full border border-white/10 flex items-center shadow-sm">
                                <span className="mr-2">🏛️</span> {user.className}
                            </span>
                        )}
                        {user?.labName && user?.role === 'LAB_INCHARGE' && (
                            <span className="bg-white/5 text-gray-300 text-xs font-bold px-4 py-1.5 rounded-full border border-white/10 flex items-center shadow-sm">
                                <span className="mr-2">🔬</span> {user.labName}
                            </span>
                        )}
                    </div>
                </div>

                {(user.role === 'LAB_INCHARGE' || user.role === 'ADVISOR') && (
                    <button
                        onClick={() => setShowQR(true)}
                        className="mt-6 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 group"
                    >
                        <Maximize size={20} className="group-hover:rotate-12 transition-transform" />
                        <span>SHOW LOCATION QR</span>
                    </button>
                )}
            </div>

            {/* Manual Upload Section - Hidden for all now as it's automated */}
            {false && user.role !== 'LAB_INCHARGE' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Academic Records</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto italic">
                        For ranking students by performance. Use headers: <code className="bg-gray-100 px-1 rounded">name</code>, <code className="bg-gray-100 px-1 rounded">id</code>, <code className="bg-gray-100 px-1 rounded">cgpa</code>, <code className="bg-gray-100 px-1 rounded">marks</code>
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-block">
                        <span>Select records.csv</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                    {error && (
                        <div className="mt-4 flex items-center justify-center text-red-600 space-x-2">
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                </div>
            )}

            {pendingRequests.length > 0 && (
                <div className="mb-12 animate-fade-in">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <CheckCircle2 className="text-blue-500 mr-2" />
                        Pending Approvals Required
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRequests.map(req => (
                            <div key={req.id} className={`p-6 rounded-3xl border shadow-2xl transition-all bg-[#141417] ${req.priorityScore >= 75 ? 'border-blue-500/20' : 'border-red-500/20'
                                }`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${req.priorityScore >= 75 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {req.priorityScore >= 75 ? 'High Performer' : 'Low Performer'}
                                            </span>
                                            <span className="text-xs font-bold text-gray-600">Request #{req.id.toString().slice(-4)}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-white">{req.studentName} <span className="text-sm font-medium text-gray-500">({req.studentId})</span></h4>
                                        <div className="text-xs font-mono text-gray-400">Score: {req.priorityScore.toFixed(1)} | Dept: {req.department}</div>
                                        <div className="text-base text-gray-300 font-medium italic">"{req.purpose}"</div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button onClick={() => handleDeny(req)} className="px-6 py-3 text-sm font-bold text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">REJECT</button>
                                        <button onClick={() => handleApprove(req)} className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all active:scale-95">APPROVE & FORWARD</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {user.role === 'ADVISOR' && globalRequests.filter(r => r.className === user.className && r.status === 'APPROVED' && !r.timerStartedAt).length > 0 && (
                <div className="mb-12 animate-fade-in">
                    <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center">
                        <Clock className="text-amber-500 mr-2" />
                        Approved ODs (Awaiting Timer Start)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {globalRequests.filter(r => r.className === user.className && r.status === 'APPROVED' && !r.timerStartedAt).map(req => (
                            <div key={`timer_${req.id}`} className="p-6 rounded-3xl border border-amber-500/20 shadow-2xl transition-all bg-[#141417]">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                Awaiting Manual Start
                                            </span>
                                            <span className="text-xs font-bold text-gray-600">Request #{req.id.toString().slice(-4)}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-white">{req.studentName} <span className="text-sm font-medium text-gray-500">({req.studentId})</span></h4>
                                        <div className="text-xs font-mono text-gray-400">Target Lab: <span className="text-amber-400 font-bold">{req.labName}</span></div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => {
                                                const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
                                                const updatedGlobal = allRequests.map(r => r.id === req.id ? { ...r, timerStartedAt: Date.now() } : r);
                                                localStorage.setItem('all_od_requests', JSON.stringify(updatedGlobal));

                                                // trigger re-render locally
                                                setGlobalRequests(updatedGlobal);
                                            }}
                                            className="px-8 py-3 text-sm font-bold text-black bg-amber-500 rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center"
                                        >
                                            <Clock size={16} className="mr-2" />
                                            START CHECK-IN TIMER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {user.role !== 'LAB_INCHARGE' && data.length > 0 && (
                <div className="bg-[#141417] rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                        <h3 className="text-xl font-bold text-white">Ranked Students</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-[#1c1c21]">
                                <tr>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Rank</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Student</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">ID</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Achievements</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Remarks</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">CGPA</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Score</th>
                                    <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-500">#{idx + 1}</td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-base font-bold text-white">{student.name}</span>
                                                {livePresence[student.id] ? (() => {
                                                    const presence = livePresence[student.id];
                                                    const expectedLab = approvedODs[student.id];

                                                    if (presence.type === 'LAB') {
                                                        const isMatch = presence.name === expectedLab;
                                                        return (
                                                            <span className={`inline-flex items-center text-[10px] font-black uppercase px-2 py-1 rounded mt-2 border shadow-sm ${isMatch
                                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                                                                }`}>
                                                                <MapPin size={10} className="mr-1" />
                                                                {isMatch ? `IN OD: ${presence.name}` : `WRONG LAB: ${presence.name}`}
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="inline-flex items-center text-[10px] font-black uppercase px-2 py-1 rounded mt-2 bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                                <User size={10} className="mr-1" /> IN CLASS: {presence.name}
                                                            </span>
                                                        );
                                                    }
                                                })() : (
                                                    <span className="text-[11px] text-gray-600 font-medium italic mt-2">Status Offline</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-400 font-mono font-bold tracking-tighter">{student.id}</td>
                                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-300 font-medium max-w-[150px] truncate">{student.achievements}</td>
                                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-300 font-medium max-w-[150px] truncate">{student.remarks}</td>
                                        <td className="px-8 py-6 whitespace-nowrap text-base text-gray-300 font-bold">{student.cgpa.toFixed(2)}</td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-24 bg-white/5 rounded-full h-1.5 mr-3 overflow-hidden">
                                                    <div className={`h-full rounded-full ${student.approved ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} style={{ width: `${Math.min(student.priorityScore, 100)}%` }}></div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-400">{student.priorityScore.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setEditingStudent(student.id);
                                                    setEditForm({
                                                        achievements: student.achievements === 'N/A' ? '' : student.achievements,
                                                        remarks: student.remarks === 'N/A' ? '' : student.remarks
                                                    });
                                                }}
                                                className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                                            >
                                                Edit Info
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showQR && (() => {
                const locationName = user.role === 'LAB_INCHARGE' ? user.labName : user.className;
                const locData = locationMap[locationName] || { floor: 'Unknown Floor', bssid: 'N/A' };
                const qrValue = JSON.stringify({
                    type: user.role === 'LAB_INCHARGE' ? 'LAB' : 'CLASS',
                    name: locationName,
                    id: user.id,
                    floor: locData.floor,
                    bssid: locData.bssid
                });

                return (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                        <div className="bg-[#141417] border border-white/10 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(59,130,246,0.15)] max-w-lg w-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle size={32} />
                                </button>
                            </div>

                            <div className="mb-10">
                                <p className="text-blue-500 font-black text-xs uppercase tracking-[0.3em] mb-4">Location QR Generator</p>
                                <h3 className="text-4xl font-extrabold text-white">{locationName}</h3>
                                <div className="flex justify-center items-center space-x-3 mt-3 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                    <span className="flex items-center"><MapPin size={12} className="mr-1" /> {locData.floor}</span>
                                    <span>•</span>
                                    <span>BSSID: {locData.bssid}</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[2.5rem] inline-block mb-10 shadow-2xl">
                                <QRCodeSVG value={qrValue} size={240} level="H" includeMargin={false} />
                            </div>

                            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed max-w-xs mx-auto">
                                Students must scan this code using their SmartOD portal to verify real-time presence.
                            </p>

                            <button
                                onClick={() => setShowQR(false)}
                                className="w-full py-5 bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl active:scale-95"
                            >
                                CLOSE DASHBOARD
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Edit Metadata Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#141417] border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(59,130,246,0.15)] max-w-lg w-full relative">
                        <h3 className="text-3xl font-extrabold text-white mb-8">Update Student Info</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Academic Achievements</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium focus:border-blue-500 outline-none transition-all resize-none h-32"
                                    placeholder="e.g. Winner of Smart India Hackathon"
                                    value={editForm.achievements}
                                    onChange={e => setEditForm({ ...editForm, achievements: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Faculty Remarks</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium focus:border-blue-500 outline-none transition-all resize-none h-32"
                                    placeholder="e.g. Highly disciplined and proactive"
                                    value={editForm.remarks}
                                    onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setEditingStudent(null)}
                                className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/5 transition-all"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSaveMetadata}
                                className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
                            >
                                SAVE UPDATES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
