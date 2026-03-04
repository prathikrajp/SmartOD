import Papa from 'papaparse';

class NotificationService {
    static async sendSMS(role, id, message) {
        try {
            const response = await fetch('/mobile_number.csv');
            const csvData = await response.text();
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const mappedUser = results.data.find(row =>
                        row.role === role && row.id === id
                    );

                    const targetNumber = mappedUser ? mappedUser.mobile_number : 'UNKNOWN NUMBER';
                    const targetName = mappedUser ? mappedUser.name : id;

                    console.log(`\n======================================================`);
                    console.log(`📱 MOCK SMS DISPATCHED: +91-${targetNumber}`);
                    console.log(`To: ${targetName} (${role})`);
                    console.log(`Message: ${message}`);
                    console.log(`======================================================\n`);
                }
            });
        } catch (err) {
            console.error('Mock SMS failed:', err);
        }
    }

    static triggerDelayedCheckinAlert(studentName, studentId, labName, advisorId, labInchargeId) {
        const timestamp = new Date().toISOString();
        const msg = `ALERT: Student ${studentName} (${studentId}) failed to scan QR code at ${labName} within 10 minutes of OD approval.`;

        // Notify Advisor
        if (advisorId) {
            this.sendSMS('ADVISOR', advisorId, msg);
        }

        // Notify Lab Incharge
        if (labInchargeId && labInchargeId.includes('LAB')) { // Ensure it's not a generic name, we need ID if possible
            this.sendSMS('LAB_INCHARGE', labInchargeId, msg);
        } else {
            // If we don't have Lab Incharge ID directly, we might need a workaround or just query by name,
            // but assuming we pass ID if available. Let's make the SMS lookup robust above.
        }

        // Add to portal notifications
        const portalViolations = JSON.parse(localStorage.getItem('od_violations') || '[]');
        portalViolations.unshift({
            id: Date.now(),
            studentId,
            studentName,
            labName,
            message: msg,
            time: timestamp,
            readBy: []
        });
        localStorage.setItem('od_violations', JSON.stringify(portalViolations));

        // Dispatch custom event to update notification bell instantly
        window.dispatchEvent(new Event('violations_updated'));
    }
}

export default NotificationService;
