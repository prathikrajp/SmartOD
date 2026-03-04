const fs = require('fs');

const filename = 'public/MAC_address.csv';
const rootFilename = 'MAC_address.csv';

if (!fs.existsSync(filename)) {
    console.error("public/MAC_address.csv not found.");
    process.exit(1);
}

const csv = fs.readFileSync(filename, 'utf-8');
const lines = csv.split('\n').filter(l => l.trim().length > 0);
const headers = lines[0].split(',');

const hasLat = headers.includes('lat');
if (!hasLat) {
    headers.push('lat', 'lng');
}

// Generate base coordinates (near Chennai Institute of Technology)
const baseLat = 12.9716;
const baseLng = 80.0435;

function randomCoordinate() {
    return {
        lat: (baseLat + (Math.random() - 0.5) * 0.005).toFixed(6),
        lng: (baseLng + (Math.random() - 0.5) * 0.005).toFixed(6)
    };
}

let newLines = [headers.join(',')];

for (let i = 1; i < lines.length; i++) {
    let parts = lines[i].split(',');
    if (!hasLat) {
        const coords = randomCoordinate();
        parts.push(coords.lat, coords.lng);
    }
    newLines.push(parts.join(','));
}

// New spots to add
const newSpots = [
    "tea time", "hut", "c2c", "tea express", "chill out",
    "pks canteen", "10 labs", "oat", "mess", "temple"
];

// Determine the index for columns
// className,department,yearOfStudy,floor,bssid,ssid,apLocation,lat,lng
newSpots.forEach((spot, index) => {
    const coords = randomCoordinate();
    const bssid = `AA:BB:CC:DD:EE:${index.toString(16).padStart(2, '0')}`;
    const row = [
        spot,           // className
        'Campus',       // department
        'All',          // yearOfStudy
        'Ground Floor', // floor
        bssid,          // bssid
        'CIT-Guest',    // ssid
        `${spot} AP`,   // apLocation
        coords.lat,     // lat
        coords.lng      // lng
    ];
    // check if it already exists
    if (!newLines.find(l => l.startsWith(`${spot},`))) {
        newLines.push(row.join(','));
    }
});

const finalCsv = newLines.join('\n');
fs.writeFileSync(filename, finalCsv);
fs.writeFileSync(rootFilename, finalCsv);

console.log('Appended new locations and GPS coordinates to MAC_address.csv');
