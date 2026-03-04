import csv
import re

def sanitize(text):
    if not text:
        return ""
    # Remove special characters and spaces, then lowercase
    return re.sub(r'[^a-zA-Z0-9]', '', text).lower()

def generate_emails():
    emails = []
    
    # Process Students
    try:
        with open('students.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = sanitize(row['name'])
                year = sanitize(row['yearOfStudy'])
                dept = sanitize(row['department'])
                email = f"{name}{year}.{dept}@citchennai.net"
                emails.append({'id': row['id'], 'name': row['name'], 'role': 'STUDENT', 'email': email})
    except FileNotFoundError:
        print("students.csv not found")

    # Process Advisors
    try:
        with open('advisors.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = sanitize(row['name'])
                cls = sanitize(row['className'])
                dept = sanitize(row['department'])
                email = f"{name}{cls}.{dept}@citchennai.net"
                emails.append({'id': row['id'], 'name': row['name'], 'role': 'ADVISOR', 'email': email})
    except FileNotFoundError:
        print("advisors.csv not found")

    # Process Lab Incharge
    try:
        with open('lab_incharge.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = sanitize(row['name'])
                lab = sanitize(row['labName'])
                email = f"{name}{lab}.coe@citchennai.net"
                emails.append({'id': row['id'], 'name': row['name'], 'role': 'LAB_INCHARGE', 'email': email})
    except FileNotFoundError:
        print("lab_incharge.csv not found")

    # Process HOD
    try:
        with open('hod.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = sanitize(row['name'])
                dept = sanitize(row['department'])
                email = f"{name}{dept}.hod@citchennai.net"
                emails.append({'id': row['id'], 'name': row['name'], 'role': 'HOD', 'email': email})
    except FileNotFoundError:
        print("hod.csv not found")

    # Save to maild.csv
    with open('public/maild.csv', 'w', newline='') as f:
        fieldnames = ['id', 'name', 'role', 'email']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(emails)
    
    print(f"Successfully generated public/maild.csv with {len(emails)} entries.")

if __name__ == "__main__":
    generate_emails()
