import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiMapPin as MapPin, FiPrinter as Printer } from 'react-icons/fi';

const Rooms = () => {
    const [selectedRoom, setSelectedRoom] = useState('lab-a1');
    const [showCode, setShowCode] = useState(false);

    const roomsList = [
        { id: 'lab-a1', name: 'Computer Lab A1', expectedMac: '00:1A:2B:3C:4D:5E' },
        { id: 'lab-b2', name: 'Electronics Lab B2', expectedMac: '11:22:33:44:55:66' },
        { id: 'class-101', name: 'Lecture Hall 101', expectedMac: 'AA:BB:CC:DD:EE:FF' }
    ];

    const currentRoom = roomsList.find(r => r.id === selectedRoom);

    const handleGenerate = () => {
        setShowCode(true);
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Lab & Room Access</h2>
                <p className="text-gray-600 mt-2">Generate QR codes to place outside rooms for student check-in.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Select Location</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Room / Lab</label>
                            <select
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                value={selectedRoom}
                                onChange={(e) => {
                                    setSelectedRoom(e.target.value);
                                    setShowCode(false);
                                }}
                            >
                                {roomsList.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-start space-x-3">
                                <MapPin className="text-gray-400 mt-0.5" size={20} />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Location Settings</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Check-ins at this location will verify against router MAC: <br />
                                        <code className="bg-gray-200 px-1 rounded mt-1 inline-block font-mono text-[10px]">{currentRoom.expectedMac}</code>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Generate Display Code
                        </button>
                    </div>
                </div>

                {showCode && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentRoom.name}</h3>
                        <p className="text-sm text-gray-500 mb-8">Scan to verify OD location presence</p>

                        <div className="bg-white p-4 rounded-2xl shadow border border-gray-100 mb-8">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    roomId: currentRoom.id,
                                    roomName: currentRoom.name,
                                    timestamp: Date.now()
                                })}
                                size={220}
                                level="H"
                            />
                        </div>

                        <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                            <Printer size={16} className="mr-2" />
                            Print Code for Door
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rooms;
