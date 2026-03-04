import csv
import hashlib
import os

# ─────────────────────────────────────────────────────────────────────────────
# generate_mac_addresses.py
#
# Reads advisors.csv to get every classroom, then generates a unique, stable
# MAC address (BSSID) for each classroom Access Point (AP).
#
# Each MAC is derived deterministically from the class name using SHA-256,
# so re-running the script always produces the same MAC for the same class.
#
# The first byte's LSB (locally administered bit) is set to 1 and the
# multicast bit is set to 0 to mark these as locally administered unicast MACs,
# which is the correct convention for virtual/simulated APs.
#
# Output: MAC_address.csv (root) and public/MAC_address.csv (for the web app)
# ─────────────────────────────────────────────────────────────────────────────

ADVISORS_CSV = os.path.join(os.path.dirname(__file__), "advisors.csv")
OUTPUT_ROOT  = os.path.join(os.path.dirname(__file__), "MAC_address.csv")
OUTPUT_PUBLIC = os.path.join(os.path.dirname(__file__), "public", "MAC_address.csv")

# Floor map: infer floor from year of study
FLOOR_MAP = {
    "1st": "Ground Floor",
    "2nd": "First Floor",
    "3rd": "Second Floor",
    "4th": "Third Floor",
}

def make_mac(class_name: str) -> str:
    """Generate a stable locally-administered unicast MAC from a class name."""
    digest = hashlib.sha256(class_name.encode()).hexdigest()
    # Take the first 12 hex chars → 6 bytes
    raw = [int(digest[i*2:i*2+2], 16) for i in range(6)]
    # Set locally administered bit (bit 1 of byte 0), clear multicast bit (bit 0)
    raw[0] = (raw[0] | 0x02) & 0xFE
    return ":".join(f"{b:02X}" for b in raw)


def main():
    if not os.path.exists(ADVISORS_CSV):
        print(f"ERROR: {ADVISORS_CSV} not found. Run the project setup first.")
        return

    LABS_CSV = os.path.join(os.path.dirname(__file__), "lab_incharge.csv")

    seen_classes   = {}   # className → row (deduplicate)
    seen_labs      = set()  # labName (deduplicate)
    seen_macs      = set()  # ensure no accidental collisions

    with open(ADVISORS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cls = row["className"].strip()
            if cls and cls not in seen_classes:
                seen_classes[cls] = row

    if os.path.exists(LABS_CSV):
        with open(LABS_CSV, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                lab = row["labName"].strip()
                if lab:
                    seen_labs.add(lab)

    rows = []
    # 1. Process Classrooms
    for cls, row in sorted(seen_classes.items()):
        mac = make_mac(cls)

        # In the astronomically unlikely case of a collision, perturb slightly
        attempt = 0
        while mac in seen_macs:
            attempt += 1
            mac = make_mac(f"{cls}_{attempt}")

        seen_macs.add(mac)
        floor = FLOOR_MAP.get(row.get("yearOfStudy", "").strip(), "Unknown Floor")

        rows.append({
            "className":    cls,
            "department":   row.get("department", "").strip(),
            "yearOfStudy":  row.get("yearOfStudy", "").strip(),
            "floor":        floor,
            "bssid":        mac,
            "ssid":         "CIT-WiFi",           # common SSID for the whole campus
            "apLocation":   f"{cls} Classroom AP",
        })

    # 2. Process Labs
    for lab in sorted(seen_labs):
        mac = make_mac(lab)
        attempt = 0
        while mac in seen_macs:
            attempt += 1
            mac = make_mac(f"{lab}_{attempt}")
        seen_macs.add(mac)
        
        rows.append({
            "className":    lab,  # Overloading className column, or could be 'Lab: ' + lab
            "department":   "N/A", # Labs are cross-departmental in this context
            "yearOfStudy":  "N/A",
            "floor":        "Lab Block", # Fallback, could map specifically if needed
            "bssid":        mac,
            "ssid":         "CIT-WiFi",
            "apLocation":   f"{lab} AP",
        })

    fieldnames = ["className", "department", "yearOfStudy", "floor", "bssid", "ssid", "apLocation"]

    for output_path in [OUTPUT_ROOT, OUTPUT_PUBLIC]:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"✅  Written {len(rows)} entries → {output_path}")

    print("\nSample output (first 5 rows):")
    for r in rows[:5]:
        print(f"  {r['className']:<10}  {r['floor']:<15}  BSSID: {r['bssid']}  SSID: {r['ssid']}")


if __name__ == "__main__":
    main()
