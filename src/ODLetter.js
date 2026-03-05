import React, { useRef } from 'react';
import { FiHash, FiMapPin, FiCalendar, FiClock, FiFileText, FiAward, FiImage, FiPrinter, FiDownload } from 'react-icons/fi';
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';

const ODLetter = ({ student, request, onBack }) => {
    const letterRef = useRef(null);

    if (!student || !request) return null;

    const isRejected = request.status === 'DENIED';

    // Determine who rejected it
    const getRejectionStage = () => {
        const mapping = {
            'LAB_INCHARGE': 'Lab Incharge',
            'ADVISOR': 'Class Advisor',
            'HOD': 'HOD'
        };
        return mapping[request.rejectedBy] || 'Authority';
    };

    const handleDownloadPDF = async () => {
        if (!letterRef.current) return;

        const html2canvas = window.html2canvas;
        const { jsPDF } = window.jspdf;

        if (!html2canvas || !jsPDF) {
            alert('Download libraries not loaded. Please refresh the page.');
            return;
        }

        try {
            const canvas = await html2canvas(letterRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`OD_Letter_${student.id}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleDownloadImage = async () => {
        if (!letterRef.current) return;

        const html2canvas = window.html2canvas;
        if (!html2canvas) {
            alert('Download libraries not loaded. Please refresh the page.');
            return;
        }

        try {
            const canvas = await html2canvas(letterRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `OD_Letter_${student.id}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating Image:', error);
            alert('Failed to generate Image. Please try again.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in print:p-0">
            <div ref={letterRef} className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
                {/* Certificate Border Decorations */}
                <div className="h-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

                <div className="p-8 md:p-14">
                    {/* Header */}
                    <div className="flex justify-center mb-8 pb-6 border-b-2 border-gray-100">
                        <img src="/cit_logo_wide.png" alt="Chennai Institute of Technology" className="h-16 w-auto" />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-gray-100 pb-10 mb-10">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black text-blue-600 tracking-tighter uppercase mb-1 italic">SmartOD Official</h1>
                            <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Academic Permission Certificate</p>
                        </div>
                        <div className="mt-6 md:mt-0 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Serial: {request.id.toString().slice(-8).toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-10">
                        <div className="text-center relative">
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                                {isRejected ? 'OD Request — Rejected' : 'Permission for On-Duty (OD)'}
                            </h2>
                            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                                {isRejected
                                    ? 'This document certifies that the following OD request was reviewed and rejected by the authority below. No On-Duty permission is granted.'
                                    : 'This is to certify that the following student has been granted official permission for On-Duty (OD) based on their academic performance and merit-based ranking system.'}
                            </p>
                            {isRejected && (
                                <div className="mt-6 inline-block">
                                    <div className="border-4 border-red-600 text-red-600 font-black text-2xl px-10 py-3 rounded-xl rotate-[-2deg] bg-red-50 tracking-widest uppercase shadow-sm">
                                        ❌ REJECTED BY {getRejectionStage().toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Student Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-3xl border border-gray-100">
                            <div className="space-y-4">
                                <div className="flex items-center text-gray-500">
                                    <FiHash className="mr-3" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Student Name & ID</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{student.name}</div>
                                <div className="text-sm font-mono text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded">{student.id}</div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center text-gray-500">
                                    <FiAward className="mr-3" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Dept & Year</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{request.department}</div>
                                <div className="text-sm text-gray-600">{request.yearOfStudy} Year</div>
                            </div>
                        </div>

                        {/* OD Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Activity Details</h4>
                                <div className="flex items-start">
                                    <FiMapPin className="text-blue-500 mt-1 mr-4" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Lab Name</p>
                                        <p className="text-lg font-bold text-gray-900">{request.labName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <FiFileText className="text-blue-500 mt-1 mr-4" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Purpose of OD</p>
                                        <p className="text-lg font-bold text-gray-900">{request.purpose}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Schedule</h4>
                                <div className="flex items-start">
                                    <FiCalendar className="text-blue-500 mt-1 mr-4" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Duration</p>
                                        <p className="text-lg font-bold text-gray-900">{request.startDate} to {request.endDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <FiClock className="text-blue-500 mt-1 mr-4" size={20} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Lab Working Hours</p>
                                        <p className="text-lg font-bold text-gray-900">{request.inTime} - {request.outTime}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validity Note */}
                        {!isRejected && (
                            <div className="bg-blue-600 text-white p-6 rounded-2xl flex items-center shadow-lg shadow-blue-100">
                                <div className="mr-4 text-white/50"><FiAward size={32} /></div>
                                <p className="text-sm font-medium leading-tight">
                                    This document is valid only during the stated dates. Access to location verification (QR Scanner)
                                    will be automatically deactivated after the end date.
                                </p>
                            </div>
                        )}

                        {/* Signatures */}
                        <div className="pt-20 grid grid-cols-3 gap-10 text-center relative">
                            <div className="space-y-4 relative">
                                {(request.status === 'FORWARDED_TO_HOD' || request.status === 'APPROVED') && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 border-2 border-amber-500/40 text-amber-500/60 text-[10px] font-black px-3 py-1 rounded-lg rotate-[-12deg] pointer-events-none uppercase tracking-widest bg-amber-50/10">Accepted</div>
                                )}
                                <div className="h-px bg-gray-200 mx-auto w-30 mb-4"></div>
                                <p className="text-sm font-bold text-gray-900">{request.advisorName}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class Advisor</p>
                            </div>

                            <div className="space-y-4 relative">
                                {request.status === 'APPROVED' && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 border-4 border-emerald-600/30 text-emerald-600/40 text-xl font-black px-4 py-1 rounded-xl rotate-[15deg] pointer-events-none uppercase bg-emerald-50/10">Approved</div>
                                )}
                                <div className="h-px bg-gray-200 mx-auto w-30 mb-4"></div>
                                <p className="text-sm font-bold text-gray-900">{request.hodName}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Head of Dept (HOD)</p>
                            </div>

                            <div className="space-y-4 relative">
                                {['PENDING_ADVISOR', 'FORWARDED_TO_HOD', 'APPROVED'].includes(request.status) && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 border-2 border-blue-500/40 text-blue-500/60 text-[10px] font-black px-3 py-1 rounded-lg rotate-[-8deg] pointer-events-none uppercase tracking-widest bg-blue-50/10">Lab Verified</div>
                                )}
                                <div className="h-px bg-gray-200 mx-auto w-30 mb-4"></div>
                                <p className="text-sm font-bold text-gray-900">{request.labInchargeName}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lab Incharge</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Generated by SmartOD Academic System</p>
                </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4 justify-center print:hidden">
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center shadow-sm"
                >
                    Back to Dashboard
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center transform active:scale-95"
                >
                    <FiFileText className="mr-2" /> Download as PDF
                </button>
                <button
                    onClick={handleDownloadImage}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center transform active:scale-95"
                >
                    <FiImage className="mr-2" /> Download as Image
                </button>
                <button
                    onClick={handlePrint}
                    className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-900 transition-all flex items-center transform active:scale-95"
                >
                    <FiPrinter className="mr-2" /> Print
                </button>
            </div>
        </div>
    );
};

export default ODLetter;
