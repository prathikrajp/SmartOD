import csv
import random
import os

def generate_student_data(num_students_per_class=30):
    """
    Generates synthetic student data mapped to existing advisors.
    Data format: id, name, cgpa, marks, department, yearOfStudy, className, classAdvisorName
    """
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
                   "Ian", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oliver", "Paula", "Quinn", "Rachel",
                   "Sam", "Tina", "Uma", "Victor", "Wendy", "Xavier", "Yara", "Zack", "Aiden", "Bella",
                   "Caleb", "Chloe", "Daniel", "Emily", "Finn", "Grace", "Henry", "Isabella", "Jack", "Lily"]
    
    last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
                  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
                  "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King"]
    
    # 1. Read Advisors
    advisors = []
    advisor_file = 'public/advisors.csv'
    if not os.path.exists(advisor_file):
        # Fallback to root if not in public
        advisor_file = 'advisors.csv'
        
    with open(advisor_file, mode='r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            advisors.append(row)

    # 2. Generate Students
    students = []
    
    # Prefix mapping for unique IDs
    dept_prefix = {
        "CSE": "CS", "ECE": "EC", "CSBS": "CB", "AIDS": "AD", "AIML": "AM", 
        "CS": "CO", "IT": "IT", "BME": "BM", "MCT": "MC", "MECH": "ME", 
        "EEE": "EE", "CVL": "CV", "VLSI": "VL", "ACT": "AC"
    }

    for advisor in advisors:
        dept = advisor['department']
        year_label = advisor['yearOfStudy']
        class_name = advisor['className']
        advisor_name = advisor['name']
        
        # Batch year for ID (e.g., 2021 batch for 1st year in 2022, etc.)
        # Simplified: Use fixed prefixes
        year_prefix = {"1st": "24", "2nd": "23", "3rd": "22", "4th": "21"}[year_label]
        
        for i in range(1, num_students_per_class + 1):
            roll_num = str(i).zfill(3)
            short_dept = dept_prefix.get(dept, "XX")
            student_id = f"{year_prefix}{short_dept}{roll_num}"
            
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # CGPA and Marks
            raw_cgpa = random.gauss(7.8, 1.0)
            cgpa = round(max(5.0, min(10.0, raw_cgpa)), 2)
            
            marks_mean = (cgpa / 10.0) * 85 + 5
            marks = round(max(40.0, min(100.0, random.gauss(marks_mean, 8))), 1)
            
            students.append({
                "id": student_id,
                "name": name,
                "cgpa": cgpa,
                "marks": marks,
                "department": dept,
                "yearOfStudy": year_label,
                "className": class_name,
                "classAdvisorName": advisor_name
            })

    # 3. Write Output
    output_files = ['public/students.csv', 'students.csv']
    for out_file in output_files:
        with open(out_file, mode='w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=["id", "name", "cgpa", "marks", "department", "yearOfStudy", "className", "classAdvisorName"])
            writer.writeheader()
            writer.writerows(students)
            
    print(f"Generated {len(students)} students across {len(advisors)} classes.")

if __name__ == "__main__":
    generate_student_data(30)
