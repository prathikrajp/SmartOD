const fs = require('fs');
const readline = require('readline');

async function processFile(filename, rolePrefix) {
    if (!fs.existsSync(filename)) return [];

    const lines = fs.readFileSync(filename, 'utf-8').split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',');
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('name');

    if (idIdx === -1 || nameIdx === -1) return [];

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length > Math.max(idIdx, nameIdx)) {
            records.push({
                id: parts[idIdx],
                name: parts[nameIdx],
                role: rolePrefix
            });
        }
    }
    return records;
}

function generateMobileNumber() {
    const starts = ['6', '7', '8', '9'];
    const start = starts[Math.floor(Math.random() * starts.length)];
    let rest = '';
    for (let i = 0; i < 9; i++) {
        rest += Math.floor(Math.random() * 10).toString();
    }
    return start + rest;
}

async function main() {
    const labs = await processFile('lab_incharge.csv', 'LAB_INCHARGE');
    const advisors = await processFile('advisors.csv', 'ADVISOR');
    const hods = await processFile('hod.csv', 'HOD');

    const allFaculty = [...labs, ...advisors, ...hods];

    let csvContent = 'id,name,role,mobile_number\n';

    allFaculty.forEach(f => {
        csvContent += `${f.id},${f.name},${f.role},${generateMobileNumber()}\n`;
    });

    fs.writeFileSync('public/mobile_number.csv', csvContent);
    fs.writeFileSync('mobile_number.csv', csvContent); // also save root for easy checking if needed
    console.log('mobile_number.csv generated with 10-digit numbers.');
}

main();
