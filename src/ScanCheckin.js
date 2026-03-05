import React, { useState, useEffect } from 'react';
import { FiCamera as Camera, FiCheckCircle as CheckCircle2, FiXCircle as XCircle, FiInfo, FiClock, FiMapPin, FiWifi } from 'react-icons/fi';
import { MdFingerprint as Fingerprint } from 'react-icons/md';
import Papa from 'papaparse';

const ScanCheckin = ({ user }) => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null); // 'success', 'error_location'
    const [locationInfo, setLocationInfo] = useState(null);
    const [activeOD, setActiveOD] = useState(null);
    const [labMetadata, setLabMetadata] = useState(null);
    const [classMetadata, setClassMetadata] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        // 1. Live Clock Timer
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);

        // 2. Find the latest APPROVED OD for this student
        const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
        const myActiveOD = allRequests
            .filter(r => r.studentId === user.id && r.status === 'APPROVED')
            .sort((a, b) => b.id - a.id)[0];

        if (myActiveOD) {
            setActiveOD(myActiveOD);

            // 3. Mark as Mock Scan Opened to pause SystemMonitor notifications
            if (!myActiveOD.mockScanOpened) {
                const updatedRequests = allRequests.map(r =>
                    r.id === myActiveOD.id ? { ...r, mockScanOpened: true } : r
                );
                localStorage.setItem('all_od_requests', JSON.stringify(updatedRequests));

                // Also update student's personal history
                const studentHistory = JSON.parse(localStorage.getItem(`od_requests_${user.id}`) || '[]');
                const updatedHistory = studentHistory.map(r =>
                    r.id === myActiveOD.id ? { ...r, mockScanOpened: true } : r
                );
                localStorage.setItem(`od_requests_${user.id}`, JSON.stringify(updatedHistory));
            }
        }

        // 4. Fetch All Location Metadata
        fetch('/MAC_address.csv')
            .then(res => res.text())
            .then(csv => {
                const parsed = Papa.parse(csv, {
                    header: true,
                    skipEmptyLines: true,
                    transform: (value) => value.trim()
                }).data;

                // Find Lab Metadata
                if (myActiveOD) {
                    const labMeta = parsed.find(row => row.className === myActiveOD.labName);
                    setLabMetadata(labMeta);
                }

                // Find Class Metadata
                const classMeta = parsed.find(row => row.className === user.className);
                setClassMetadata(classMeta);
            });

        return () => clearInterval(clockInterval);
    }, [user.id, user.className]);

    const handleCheckIn = (scannedData) => {
        setScanning(true);
        setResult(null);

        setTimeout(() => {
            try {
                const data = JSON.parse(scannedData);
                if (data.type && data.name) {
                    // Update global live presence store
                    const presence = JSON.parse(localStorage.getItem('live_presence') || '{}');
                    presence[user.id] = {
                        type: data.type,
                        name: data.name,
                        checkInTime: new Date().toLocaleTimeString(),
                        facultyId: data.id,
                        floor: data.floor || 'Unknown',
                        bssid: data.bssid || 'N/A'
                    };
                    localStorage.setItem('live_presence', JSON.stringify(presence));

                    // Mark as scanned to disable future mock scans for this OD
                    if (activeOD) {
                        const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
                        const updatedGlobal = allRequests.map(r =>
                            r.id === activeOD.id ? { ...r, scanned: true } : r
                        );
                        localStorage.setItem('all_od_requests', JSON.stringify(updatedGlobal));

                        const studentHistory = JSON.parse(localStorage.getItem(`od_requests_${user.id}`) || '[]');
                        const updatedHistory = studentHistory.map(r =>
                            r.id === activeOD.id ? { ...r, scanned: true } : r
                        );
                        localStorage.setItem(`od_requests_${user.id}`, JSON.stringify(updatedHistory));
                        setActiveOD({ ...activeOD, scanned: true });
                    }

                    setLocationInfo(data);
                    setResult('success');
                } else {
                    setResult('error_location');
                }
            } catch (e) {
                setResult('error_location');
            }
            setScanning(false);
        }, 1200);
    };

    return (
        <div className="max-w-md mx-auto py-12 px-4 animate-fade-in">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">Scanner Portal</h2>
                <div className="mt-4 flex items-center justify-center space-x-3 bg-blue-500/10 border border-blue-500/20 py-2 px-6 rounded-2xl mx-auto inline-flex">
                    <FiClock className="text-blue-500 animate-pulse" />
                    <span className="text-blue-400 font-black text-sm tabular-nums">{currentTime}</span>
                </div>
            </div>

            {/* Active Task Info */}
            <div className="mb-8 space-y-4">
                {activeOD ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 shadow-xl shadow-blue-900/10 transition-all hover:bg-blue-500/20 group">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                                <FiInfo size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Target Resource (Lab)</p>
                                <p className="text-lg font-bold text-white leading-tight">{activeOD.labName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Purpose</p>
                                <p className="text-xs font-bold text-gray-300 truncate">{activeOD.purpose}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Safety Status</p>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Timer Paused</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 text-center">
                        <p className="text-sm font-bold text-amber-500 italic">No Approved OD Activity Detected</p>
                    </div>
                )}
            </div>

            {/* Scanner Body */}
            <div className="bg-[#141417] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden relative">
                <div className="bg-gray-900 aspect-square relative flex items-center justify-center">
                    {scanning ? (
                        <div className="absolute inset-0 bg-[#0a0a0b]/90 flex flex-col items-center justify-center backdrop-blur-md z-30">
                            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-blue-400 font-black uppercase text-xs tracking-widest animate-pulse">Syncing with Campus AP...</p>
                        </div>
                    ) : result === null ? (
                        <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center">
                            <div className="w-56 h-56 border-2 border-dashed border-gray-800 rounded-[3rem] mb-10 flex items-center justify-center bg-white/5 relative group">
                                <Camera className="text-gray-700 group-hover:text-blue-500 transition-colors" size={56} />
                                <div className="absolute inset-8 border-2 border-blue-500/20 rounded-3xl animate-pulse"></div>
                                <div className="absolute inset-4 border border-white/5 rounded-[2.5rem]"></div>
                            </div>

                            <div className="w-full space-y-4 px-4">
                                {/* Option 1: Mock Lab */}
                                {activeOD && labMetadata && !activeOD.scanned ? (
                                    <button
                                        onClick={() => handleCheckIn(JSON.stringify({
                                            type: 'LAB',
                                            name: activeOD.labName,
                                            id: activeOD.labInchargeId || 'LAB001',
                                            floor: labMetadata.floor || 'Unknown',
                                            bssid: labMetadata.bssid || 'N/A'
                                        }))}
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black shadow-xl shadow-blue-900/40 transition-all active:scale-95 uppercase tracking-[0.15em] flex flex-col items-center"
                                    >
                                        <span>Mock Scanner for Lab</span>
                                        <span className="text-[9px] opacity-70 font-bold mt-1 tracking-normal">{activeOD.labName} • {labMetadata.bssid}</span>
                                    </button>
                                ) : (
                                    <div className="w-full py-5 bg-white/5 text-gray-600 rounded-2xl text-[11px] font-black border border-white/5 uppercase tracking-[0.15em] flex flex-col items-center">
                                        <span>Mock Scanner for Lab (Inactive)</span>
                                        {activeOD?.scanned && <span className="text-[8px] text-emerald-500 mt-1 opacity-50 italic">Scan Already Recorded</span>}
                                    </div>
                                )}

                                {/* Option 2: Mock Class */}
                                {classMetadata && (!activeOD || !activeOD.scanned) ? (
                                    <button
                                        onClick={() => handleCheckIn(JSON.stringify({
                                            type: 'CLASS',
                                            name: user.className,
                                            id: 'ADV_DEFAULT',
                                            floor: classMetadata.floor || '1st Floor',
                                            bssid: classMetadata.bssid || 'N/A'
                                        }))}
                                        className="w-full py-5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-2xl text-[11px] font-black border border-emerald-500/30 transition-all active:scale-95 uppercase tracking-[0.15em] flex flex-col items-center"
                                    >
                                        <span>Mock Scanner for Class</span>
                                        <span className="text-[9px] opacity-70 font-bold mt-1 tracking-normal">{user.className} • {classMetadata.bssid}</span>
                                    </button>
                                ) : (
                                    <div className="w-full py-5 bg-white/5 text-gray-600 rounded-2xl text-[11px] font-black border border-white/5 uppercase tracking-[0.15em] flex flex-col items-center">
                                        <span>Mock Scanner for Class (Inactive)</span>
                                        {activeOD?.scanned && <span className="text-[8px] text-emerald-500 mt-1 opacity-50 italic">Scan Already Recorded</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#141417] absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-40">
                            {result === 'success' ? (
                                <>
                                    <div className="bg-emerald-500/10 text-emerald-500 rounded-[2rem] p-8 mb-6 border border-emerald-500/20 animate-bounce">
                                        <CheckCircle2 size={64} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Access Verified</h3>
                                    <div className="w-full space-y-4 text-left bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Venue</p>
                                            <p className="text-sm font-bold text-white">{locationInfo.name}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Type</p>
                                            <p className="text-sm font-bold text-white">{locationInfo.type}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Physical Signature</p>
                                            <p className="text-sm font-black text-emerald-400 font-mono tracking-tighter">{locationInfo.name}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-red-500/10 text-red-500 rounded-[2rem] p-8 mb-8 border border-red-500/20">
                                        <XCircle size={64} />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-4 uppercase">Signal Collision</h3>
                                    <p className="text-gray-500 mb-8 text-xs font-medium">Authentication failed. Unable to resolve campus BSSID.</p>
                                </>
                            )}
                            <button
                                onClick={() => setResult(null)}
                                className="w-full mt-6 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-200 active:scale-95 shadow-2xl"
                            >
                                Re-verify Location
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 p-8 flex items-start space-x-6 border-t border-white/5">
                    <Fingerprint className="text-blue-500 mt-1 shrink-0" size={32} />
                    <div>
                        <p className="text-xs text-white font-black uppercase tracking-[0.2em]">Infrastructure Telemetry</p>
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed font-medium">
                            The IoT backend is actively verifying your floor proximity and hardware footprint. High-precision monitoring is enabled.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanCheckin;
