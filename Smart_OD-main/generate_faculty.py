import csv
import random
import os
import shutil

# Final, rectified faculty generation script
def generate_faculty_data():
    # 1. Configuration
    departments = ["CSE", "ECE", "CSBS", "AIDS", "AIML", "CS", "IT", "BME", "MCT", "MECH", "EEE", "CVL", "VLSI", "ACT"]
    
    first_names = ["Arun", "Bala", "Chitra", "Deepak", "Eshwar", "Farina", "Gopal", "Harini", "Indu", "Jagan",
                   "Karthik", "Latha", "Mani", "Naveen", "Omprakash", "Priya", "Rajesh", "Suresh", "Tamil", "Uma",
                   "Sanjay", "Anitha", "Kavitha", "Sundar", "Malini"]
    last_names = ["Kumar", "Selvan", "Prakash", "Devi", "Rajan", "Baskaran", "Murugan", "Sami", "Nathan", "Ganesh",
                  "Lakshmi", "Vignesh", "Meena", "Shankar", "Varman", "Moorthy", "Reddy", "Iyer", "Nair", "Pillai"]

    # Labs as specified by the user
    labs = ["CADENCE", "KUKA", "IA", "DRONE", "BAJA", "AI", "PCB", "CLOUD COMPUTING", "IOT", "EMBEDED"]

    # Generate a shuffled unique name pool
    name_pool = list(set([f"{f} {l}" for f in first_names for l in last_names]))
    random.shuffle(name_pool)

    public_dir = "public"
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)

    # 2. Generate HODs
    hod_list = []
    # ID: HOD001, HOD002...
    for idx, dept in enumerate(departments, 1):
        hod_id = f"HOD{idx:03d}"
        title = random.choice(["Dr. ", "Prof. "])
        name = title + name_pool.pop() if name_pool else f"{title} Faculty {hod_id}"
        
        hod_list.append({
            "id": hod_id,
            "name": name,
            "department": dept
        })

    with open(os.path.join(public_dir, 'hod.csv'), 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "department"])
        writer.writeheader()
        writer.writerows(hod_list)

    # 3. Generate Advisors
    advisor_list = []
    adv_id_counter = 1 # Global counter for Advisor IDs (ADV001 to ADV140)
    
    for dept in departments:
        # Internal counter for class naming (1 to 10 per department)
        class_num = 1
        
        # Mapping for 1st: 4, 2nd: 3, 3rd: 2, 4th: 1 (Total 10)
        distribution = [("1st", 4), ("2nd", 3), ("3rd", 2), ("4th", 1)]
        
        for year_label, count in distribution:
            for _ in range(count):
                adv_id = f"ADV{adv_id_counter:03d}"
                class_identifier = f"{dept}-{class_num}"
                title = random.choice(["Prof. ", "Dr. "])
                name = title + name_pool.pop() if name_pool else f"{title} Staff {adv_id}"
                
                advisor_list.append({
                    "id": adv_id,
                    "name": name,
                    "department": dept,
                    "className": class_identifier,
                    "yearOfStudy": year_label
                })
                
                # CRITICAL: Increment both counters
                # adv_id_counter ensures unique IDs across all depts
                # class_num ensures 1-10 sequence within the dept
                adv_id_counter += 1
                class_num += 1

    with open(os.path.join(public_dir, 'advisors.csv'), 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "department", "className", "yearOfStudy"])
        writer.writeheader()
        writer.writerows(advisor_list)

    # 4. Generate Lab Incharges (ID, Name, LabName)
    lab_incharge_list = []
    for i, lab in enumerate(labs):
        incharge_id = f"LAB{i+1:03d}"
        title = random.choice(["Prof. ", "Mr. ", "Ms. "])
        name = title + name_pool.pop() if name_pool else f"{title} Incharge {lab}"
        
        lab_incharge_list.append({
            "id": incharge_id,
            "name": name,
            "labName": lab
        })

    with open(os.path.join(public_dir, 'lab_incharge.csv'), 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "labName"])
        writer.writeheader()
        writer.writerows(lab_incharge_list)

    # Sync to root
    shutil.copy(os.path.join(public_dir, 'hod.csv'), 'hod.csv')
    shutil.copy(os.path.join(public_dir, 'advisors.csv'), 'advisors.csv')
    shutil.copy(os.path.join(public_dir, 'lab_incharge.csv'), 'lab_incharge.csv')

    print(f"Rectified Generation Complete.")
    print(f"- HODs generated: {len(hod_list)}")
    print(f"- Advisors generated: {len(advisor_list)}")
    print(f"- Lab Incharges generated: {len(lab_incharge_list)}")

if __name__ == "__main__":
    generate_faculty_data()
