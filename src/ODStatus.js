import React, { useState, useEffect } from 'react';
import { FiFileText, FiCheckCircle, FiXCircle, FiTrendingUp, FiBarChart2, FiSend, FiClock, FiCalendar, FiMapPin, FiUser, FiArrowRight, FiDownload, FiInfo } from 'react-icons/fi';
import Papa from 'papaparse';
import ODLetter from './ODLetter';

const ODStatus = ({ user }) => {
    const [showForm, setShowForm] = useState(false);
    const [showLetter, setShowLetter] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requestHistory, setRequestHistory] = useState([]);
    const [studentMetadata, setStudentMetadata] = useState({ achievements: 'N/A', remarks: 'N/A' });

    // Faculty Data lists
    const [hodList, setHodList] = useState([]);
    const [advisorList, setAdvisorList] = useState([]);
    const [labInchargeList, setLabInchargeList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        department: '',
        yearOfStudy: '1st',
        className: '',
        labName: '',
        labInchargeName: '',
        purpose: '',
        inTime: '08:00',
        outTime: '17:00',
        startDate: '',
        endDate: '',
        advisorName: '',
        hodName: ''
    });

    useEffect(() => {
        // Load student's request history
        const saved = localStorage.getItem(`od_requests_${user?.id}`);
        if (saved) setRequestHistory(JSON.parse(saved));

        // Load Faculty Data
        fetch('/hod.csv')
            .then(r => r.text())
            .then(csv => {
                Papa.parse(csv, { header: true, skipEmptyLines: true, complete: res => setHodList(res.data) });
            });

        fetch('/advisors.csv')
            .then(r => r.text())
            .then(csv => {
                Papa.parse(csv, { header: true, skipEmptyLines: true, complete: res => setAdvisorList(res.data) });
            });

        fetch('/lab_incharge.csv')
            .then(r => r.text())
            .then(csv => {
                Papa.parse(csv, { header: true, skipEmptyLines: true, complete: res => setLabInchargeList(res.data) });
            });

        // Load metadata
        const savedMetadata = JSON.parse(localStorage.getItem('student_metadata') || '{}');
        if (savedMetadata[user?.id]) {
            setStudentMetadata(savedMetadata[user.id]);
        }
    }, [user]);

    if (!user) return null;

    const cgpa = parseFloat(user.cgpa) || 0;
    const marks = parseFloat(user.marks) || 0;
    const priorityScore = (cgpa * 10 * 0.6) + (marks * 0.4);
    const isApprovedInitial = priorityScore > 60;

    // Credential validation: check if what the student selected matches their actual profile
    const credentialMismatch = (
        (formData.department && formData.department !== user.department) ||
        (formData.yearOfStudy && formData.yearOfStudy !== user.yearOfStudy) ||
        (formData.className && formData.className !== user.className)
    );

    const currentRequest = requestHistory[0];

    // Derive HOD and Class list when Dept or Year changes
    const departments = [...new Set(hodList.map(h => h.department))].sort();
    const availableClasses = advisorList.filter(a =>
        a.department === formData.department &&
        a.yearOfStudy === formData.yearOfStudy
    ).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

    const handleDeptChange = (dept) => {
        const hod = hodList.find(h => h.department === dept);
        const filteredClasses = advisorList.filter(a => a.department === dept && a.yearOfStudy === formData.yearOfStudy);
        const firstClass = filteredClasses.length > 0 ? filteredClasses[0] : null;

        setFormData({
            ...formData,
            department: dept,
            hodName: hod ? hod.name : '',
            className: firstClass ? firstClass.className : '',
            advisorName: firstClass ? firstClass.name : ''
        });
    };

    const handleYearChange = (year) => {
        const filteredClasses = advisorList.filter(a => a.department === formData.department && a.yearOfStudy === year);
        const firstClass = filteredClasses.length > 0 ? filteredClasses[0] : null;

        setFormData({
            ...formData,
            yearOfStudy: year,
            className: firstClass ? firstClass.className : '',
            advisorName: firstClass ? firstClass.name : ''
        });
    };

    const handleClassChange = (clsName) => {
        const advisor = advisorList.find(a => a.className === clsName);
        setFormData({
            ...formData,
            className: clsName,
            advisorName: advisor ? advisor.name : ''
        });
    };

    const handleLabChange = (labName) => {
        const incharge = labInchargeList.find(l => l.labName === labName);
        setFormData({
            ...formData,
            labName: labName,
            labInchargeName: incharge ? incharge.name : ''
        });
    };

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        let status = 'PENDING';
        if (priorityScore > 80) {
            status = 'APPROVED';
        } else if (priorityScore >= 60) {
            status = 'FORWARDED_TO_HOD';
        } else {
            status = 'DENIED';
        }

        const newRequest = {
            ...formData,
            id: Date.now(),
            studentId: user.id,
            studentName: user.name,
            cgpa: cgpa,
            marks: marks,
            priorityScore: priorityScore,
            status: 'PENDING_LAB', // Start at Lab Incharge level
            requestedAt: new Date().toISOString()
        };

        setTimeout(() => {
            // Update personal history
            const updatedHistory = [newRequest, ...requestHistory];
            setRequestHistory(updatedHistory);
            localStorage.setItem(`od_requests_${user.id}`, JSON.stringify(updatedHistory));

            // Update Global Store for Faculty
            const globalRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
            localStorage.setItem('all_od_requests', JSON.stringify([newRequest, ...globalRequests]));

            setLoading(false);
            setShowForm(false);
        }, 1200);
    };

    const isLetterValid = () => {
        if (!currentRequest || (currentRequest.status !== 'APPROVED' && currentRequest.status !== 'HOD_APPROVED')) return false;
        const today = new Date().toISOString().split('T')[0];
        return today >= currentRequest.startDate && today <= currentRequest.endDate;
    };

    const simulateHODApproval = () => {
        const updated = [...requestHistory];
        updated[0].status = 'APPROVED';
        setRequestHistory(updated);
        localStorage.setItem(`od_requests_${user.id}`, JSON.stringify(updated));
    };

    if (showLetter) {
        return <ODLetter student={user} request={currentRequest} onBack={() => setShowLetter(false)} />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-[#141417]/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-br from-[#1a1a1e] to-[#141417] px-10 py-12 text-white border-b border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <div className="w-24 h-24 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center border border-blue-500/20 text-4xl font-black shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-white tracking-tight">{user.name}</h2>
                                <p className="text-gray-500 flex items-center mt-2 font-medium tracking-wide">
                                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-sm mr-3 border border-white/5">{user.id}</span>
                                    Terminal Authority: Student
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {user.yearOfStudy && (
                                        <span className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                                            Year {user.yearOfStudy}
                                        </span>
                                    )}
                                    {user.className && (
                                        <span className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                                            Grid {user.className}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 md:mt-0 text-right">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Service Status</div>
                            <div className={`inline-flex items-center px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase shadow-lg ${isApprovedInitial ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                {isApprovedInitial ? <><FiCheckCircle size={14} className="mr-2" /> Clearance Granted</> : <><FiXCircle size={14} className="mr-2" /> Denied Access</>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10">
                    <h3 className="text-xl font-black text-white mb-8 flex items-center tracking-tight">
                        <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mr-4 border border-blue-500/20">
                            <FiFileText size={16} />
                        </div>
                        Academic Baseline Verification
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 group hover:border-blue-500/30 transition-all hover:bg-white/[0.07]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Historical CGPA</span>
                                <FiTrendingUp className="text-blue-500" />
                            </div>
                            <div className="text-5xl font-black text-white leading-none mb-6">
                                {cgpa} <span className="text-lg font-bold text-gray-600 tracking-normal ml-1">/ 10</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${cgpa * 10}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 group hover:border-emerald-500/30 transition-all hover:bg-white/[0.07]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Achievements & Remarks</span>
                                <FiBarChart2 className="text-emerald-500" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Latest Achievement</span>
                                    <p className="text-sm font-bold text-white leading-relaxed">{studentMetadata.achievements || 'No achievements recorded yet.'}</p>
                                </div>
                                <div className="pt-2 border-t border-white/5">
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Faculty Remarks</span>
                                    <p className="text-sm font-medium text-gray-400 italic">"{studentMetadata.remarks || 'Maintain positive momentum.'}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-8 rounded-[2rem] border ${isApprovedInitial ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                        <h4 className="font-black text-lg mb-3 tracking-tight">{isApprovedInitial ? 'Request Protocol Enabled' : 'Threshold Mismatch'}</h4>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <p className="text-sm font-medium leading-relaxed opacity-80 flex-1">
                                {isApprovedInitial ? "Your academic markers meet the primary clear-path threshold. You are authorized to generate an On-Duty request." : "Academic verification failed. Current metrics do not support automatic OD authorization."}
                            </p>
                            {isApprovedInitial && (
                                <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center">
                                    <FiSend className="mr-2" /> Initial Request
                                </button>
                            )}
                        </div>
                    </div>

                    {currentRequest && (
                        <div className="mt-12 border-t border-white/5 pt-12">
                            <h3 className="text-xl font-black text-white mb-8 flex items-center tracking-tight">
                                <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mr-4 border border-blue-500/20">
                                    <FiClock size={16} />
                                </div>
                                Deployment Logs
                            </h3>
                            <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                                    <div className="space-y-5 flex-1">
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${currentRequest.status.includes('APPROVED') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                (currentRequest.status.includes('PENDING') || currentRequest.status === 'FORWARDED_TO_HOD') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    currentRequest.status === 'DENIED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-gray-500/10 text-gray-500 border-white/10'
                                                }`}>
                                                {currentRequest.status === 'PENDING_LAB' ? 'Waiting for Lab Incharge Approval' :
                                                    currentRequest.status === 'PENDING_ADVISOR' ? 'Waiting for Class Advisor Approval' :
                                                        currentRequest.status === 'FORWARDED_TO_HOD' ? 'Waiting for HOD Approval' :
                                                            currentRequest.status.replace(/_/g, ' ')}
                                            </span>
                                            {currentRequest.status === 'PENDING_LAB' && (
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">L-1 Lab Verification</span>
                                            )}
                                        </div>
                                        <h4 className="text-3xl font-black text-white leading-tight tracking-tight">{currentRequest.purpose}</h4>
                                        <div className="flex flex-wrap gap-6 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                                            <div className="flex items-center"><FiMapPin className="mr-2 text-blue-500" /> {currentRequest.labName}</div>
                                            <div className="flex items-center"><FiCalendar className="mr-2 text-blue-500" /> {currentRequest.startDate} - {currentRequest.endDate}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                                        {currentRequest.status === 'FORWARDED_TO_HOD' ? (
                                            <button onClick={simulateHODApproval} className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-6 py-3 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all uppercase tracking-widest">Override Validation</button>
                                        ) : (currentRequest.status.includes('APPROVED') && isLetterValid()) ? (
                                            <button onClick={() => setShowLetter(true)} className="flex items-center px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-black/40 w-full md:w-auto">
                                                <FiDownload className="mr-3" size={18} /> Credentials
                                            </button>
                                        ) : (currentRequest.status.includes('APPROVED')) ? (
                                            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-6 py-3 rounded-xl border border-red-500/20 uppercase tracking-widest">Security Expired</span>
                                        ) : currentRequest.status === 'DENIED' ? (
                                            <button onClick={() => setShowLetter(true)} className="flex items-center px-8 py-4 bg-red-600/10 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-red-600/20 w-full md:w-auto">
                                                <FiDownload className="mr-3" size={18} /> Rejection Notice
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0b]/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#141417] rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/5 relative">
                        <div className="sticky top-0 bg-[#141417] z-10 px-10 py-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tight">Deployment Request</h3>
                                <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] mt-1">L-0 Application Protocol</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="w-12 h-12 bg-white/5 text-gray-500 rounded-2xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5"><FiXCircle size={24} /></button>
                        </div>

                        <div className="p-10">
                            <form onSubmit={handleRequestSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Grid Department</label>
                                        <select required className="form-input" value={formData.department} onChange={e => handleDeptChange(e.target.value)}>
                                            <option value="">Select Dept</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Study Cycle</label>
                                        <select className="form-input" value={formData.yearOfStudy} onChange={e => handleYearChange(e.target.value)}>
                                            <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Class Designation</label>
                                        <select required className="form-input" disabled={!formData.department || !formData.yearOfStudy} value={formData.className} onChange={e => handleClassChange(e.target.value)}>
                                            <option value="">Select Class</option>
                                            {availableClasses.map(c => <option key={c.className} value={c.className}>{c.className}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-500/5 p-8 rounded-[2rem] border border-blue-500/10">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500"><FiUser size={20} /></div>
                                        <div>
                                            <label className="block text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1">Class Advisor</label>
                                            <div className="text-sm font-bold text-white leading-none">{formData.advisorName || 'Pending select...'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-5">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500"><FiUser size={20} /></div>
                                        <div>
                                            <label className="block text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1">HOD Master</label>
                                            <div className="text-sm font-bold text-white leading-none">{formData.hodName || 'Pending select...'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Target Lab</label>
                                        <select required className="form-input" value={formData.labName} onChange={e => handleLabChange(e.target.value)}>
                                            <option value="">Select Lab</option>
                                            {labInchargeList.map(l => <option key={l.labName} value={l.labName}>{l.labName}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Incharge Contact</label>
                                        <div className="form-input bg-white/5 border-white/5 text-gray-400 font-bold flex items-center h-[50px]">
                                            {formData.labInchargeName || 'Auto-mapping...'}
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Deployment Purpose</label>
                                        <input required type="text" placeholder="e.g. Core Research" className="form-input" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">In Bound</label>
                                            <input required type="time" className="form-input" value={formData.inTime} onChange={e => setFormData({ ...formData, inTime: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 ml-1">Out Bound</label>
                                            <input required type="time" className="form-input" value={formData.outTime} onChange={e => setFormData({ ...formData, outTime: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">Launch Date</label>
                                            <input required type="date" className="form-input border-blue-500/20" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">End Cycle</label>
                                            <input required type="date" className="form-input border-blue-500/20" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        disabled={loading || !formData.advisorName || credentialMismatch}
                                        type="submit"
                                        className="w-full py-6 bg-white text-black font-black rounded-[1.5rem] shadow-[0_10px_40px_rgba(255,255,255,0.1)] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center transform active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-xs"
                                    >
                                        {loading ? <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin"></div> : 'Commit Deployment Request'}
                                    </button>
                                </div>
                                {credentialMismatch && (
                                    <div className="mt-6 flex items-center justify-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                        <span className="text-red-500 text-xl font-bold">!</span>
                                        <p className="text-xs font-black text-red-500 uppercase tracking-wider">Credential Mismatch: Origin parameters do not align with identity profile.</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .form-input { width: 100%; height: 50px; padding: 0 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; color: white; font-weight: 700; font-size: 14px; outline: none; transition: all 0.2s; }
        .form-input:focus { border-color: #3b82f6; background: rgba(255,255,255,0.08); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .form-input option { background: #141417; color: white; }
        .form-input:disabled { opacity: 0.3; cursor: not-allowed; }
      `}} />
        </div>
    );
};

export default ODStatus;
