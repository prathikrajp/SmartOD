import React, { useEffect } from 'react';
import NotificationService from './NotificationService';

const DEV_MODE_FAST_TIMEOUT = 25 * 1000; // 25 seconds for dev/testing mock
const PROD_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const SystemMonitor = () => {
    useEffect(() => {
        const checkTimeouts = () => {
            const allRequests = JSON.parse(localStorage.getItem('all_od_requests') || '[]');
            const livePresence = JSON.parse(localStorage.getItem('live_presence') || '{}');

            let updated = false;

            const updatedRequests = allRequests.map(req => {
                if (req.status === 'APPROVED' && req.timerStartedAt && !req.timeoutTriggered && !req.mockScanOpened) {
                    const timePassed = Date.now() - req.timerStartedAt;
                    // Use DEV_MODE_FAST_TIMEOUT (25 seconds) for demonstration, else PROD_TIMEOUT
                    if (timePassed > DEV_MODE_FAST_TIMEOUT) {
                        const presence = livePresence[req.studentId];

                        // Check if student is present in the requested lab
                        const inCorrectLab = presence && presence.type === 'LAB' && presence.name === req.labName;

                        if (!inCorrectLab) {
                            // Trigger violation
                            req.timeoutTriggered = true;
                            updated = true;

                            // Find Advisor ID (to fetch phone number) by looking up user directory? 
                            // Since we only store names in the request currently (req.advisorName, req.labInchargeName),
                            // we'll pass the names and let NotificationService try to find them or just log it.
                            // In a real DB, we'd have their IDs. For mock, NotificationService will just do its best 
                            // or we can pass the names directly if we modify NotificationService to search by name.
                            NotificationService.triggerDelayedCheckinAlert(
                                req.studentName,
                                req.studentId,
                                req.labName,
                                req.advisorName, // Might need lookup logic if NotificationService expects ID
                                req.labInchargeName
                            );
                        }
                    }
                }
                return req;
            });

            if (updated) {
                localStorage.setItem('all_od_requests', JSON.stringify(updatedRequests));
                // Update personal history as well to keep in sync
                const studentsWithUpdates = new Set(updatedRequests.filter(r => r.timeoutTriggered).map(r => r.studentId));
                studentsWithUpdates.forEach(studentId => {
                    const studentHistory = JSON.parse(localStorage.getItem(`od_requests_${studentId}`) || '[]');
                    const syncHistory = studentHistory.map(r => {
                        const globalMatch = updatedRequests.find(gr => gr.id === r.id);
                        return globalMatch ? { ...r, timeoutTriggered: globalMatch.timeoutTriggered } : r;
                    });
                    localStorage.setItem(`od_requests_${studentId}`, JSON.stringify(syncHistory));
                });
            }
        };

        const interval = setInterval(checkTimeouts, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return null; // This component has no UI, only background logic
};

export default SystemMonitor;
