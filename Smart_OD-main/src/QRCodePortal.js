import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiPrinter, FiMaximize, FiInfo } from 'react-icons/fi';
import Papa from 'papaparse';

const QRCodePortal = ({ user }) => {
    const [locationMap, setLocationMap] = useState({});

    useEffect(() => {
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
    }, []);

    const locationName = user.role === 'LAB_INCHARGE' ? user.labName : user.className;
    const locData = locationMap[locationName] || { floor: 'Verifying Floor...', bssid: 'N/A' };

    // Generate QR value based on role and location data
    const qrValue = JSON.stringify({
        type: user.role === 'LAB_INCHARGE' ? 'LAB' : 'CLASS',
        name: locationName,
        id: user.id,
        floor: locData.floor,
        bssid: locData.bssid
    });

    const locationType = user.role === 'LAB_INCHARGE' ? 'Laboratory' : 'Classroom';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto py-16 px-6 animate-fade-in">
            <div className="text-center mb-16 no-print">
                <h2 className="text-5xl font-black text-white tracking-tight mb-6">Location Beacon</h2>
                <p className="text-lg text-gray-500 font-medium tracking-wide">
                    Broadcasting unique check-in signal for <span className="text-blue-500 font-black">{locationName}</span>
                </p>
                <div className="flex items-center justify-center mt-6 space-x-4">
                    <span className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5 flex items-center">
                        <FiMaximize size={12} className="mr-2" /> {locData.floor}
                    </span>
                    <span className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5">
                        BSSID: {locData.bssid}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center">
                <div className="bg-[#141417]/90 backdrop-blur-3xl p-16 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/5 text-center print:shadow-none print:border-none print:p-0 print:bg-white relative overflow-hidden group">
                    {/* Decorative Gradient Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-1000"></div>

                    <div className="mb-10 relative z-10">
                        <span className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">
                            {locationType} Authentication
                        </span>
                    </div>

                    <h3 className="text-4xl font-black text-white mb-10 tracking-tight print:text-5xl print:text-black relative z-10">{locationName}</h3>

                    <div className="inline-block p-10 bg-white rounded-[3rem] shadow-2xl mb-10 print:shadow-none print:p-0 border-8 border-white group-hover:scale-[1.02] transition-transform duration-500">
                        <QRCodeSVG value={qrValue} size={320} level="H" includeMargin={false} />
                    </div>

                    <div className="space-y-3 mb-4 print:mt-12 relative z-10">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Secure Gateway Node</p>
                        <p className="text-xs font-mono text-gray-500 bg-white/5 px-4 py-2 rounded-xl inline-block border border-white/5">ID: {user.id}</p>
                    </div>

                    <div className="no-print mt-12 flex flex-wrap justify-center gap-6 relative z-10">
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95"
                        >
                            <FiPrinter className="mr-3" size={20} /> Generate Poster
                        </button>
                    </div>
                </div>

                <div className="mt-16 max-w-md no-print p-8 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 backdrop-blur-md">
                    <div className="flex items-start">
                        <div className="bg-blue-500/10 p-3 rounded-2xl mr-5 border border-blue-500/20">
                            <FiMaximize size={22} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-2">Protocol Guidelines</h4>
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                Deploy this physical gateway near the primary access point of your {locationType.toLowerCase()}.
                                The hardware-encrypted BSSID and Floor parameters are embedded for verification.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                }
            ` }} />
        </div>
    );
};

export default QRCodePortal;
