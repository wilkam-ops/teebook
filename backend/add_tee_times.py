#!/usr/bin/env python3
"""Script pour ajouter des créneaux horaires pour les 15 prochains jours"""

import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid

# Charger les variables d'environnement
load_dotenv()

# Configuration MongoDB
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# Créneaux horaires disponibles (matin et après-midi)
TIME_SLOTS = [
    "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
    "10:00", "10:30", "11:00", "11:30", "12:00",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
]

async def add_tee_times():
    # Connexion MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Récupération des parcours...")
    courses = await db.courses.find().to_list(None)
    
    if not courses:
        print("❌ Aucun parcours trouvé!")
        return
    
    print(f"✅ {len(courses)} parcours trouvés")
    
    # Date de début (aujourd'hui)
    start_date = datetime.now().date()
    
    total_added = 0
    
    for day in range(15):
        current_date = start_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        
        print(f"\n📅 Ajout des créneaux pour {date_str}...")
        
        for course in courses:
            course_id = course['id']
            course_name = course['name']
            
            # Vérifier si des créneaux existent déjà pour ce jour/parcours
            existing_count = await db.tee_times.count_documents({
                "courseId": course_id,
                "date": date_str
            })
            
            if existing_count > 0:
                print(f"  ⏭️  {course_name}: {existing_count} créneaux déjà existants")
                continue
            
            # Ajouter tous les créneaux horaires
            tee_times = []
            for time_slot in TIME_SLOTS:
                tee_time = {
                    "id": str(uuid.uuid4()),
                    "courseId": course_id,
                    "date": date_str,
                    "time": time_slot,
                    "maxSlots": 4,
                    "bookedSlots": 0,
                    "availableSlots": 4,
                    "createdAt": datetime.utcnow()
                }
                tee_times.append(tee_time)
            
            # Insertion en masse
            if tee_times:
                await db.tee_times.insert_many(tee_times)
                total_added += len(tee_times)
                print(f"  ✅ {course_name}: {len(tee_times)} créneaux ajoutés")
    
    print(f"\n🎉 Terminé! {total_added} créneaux ajoutés au total")
    client.close()

if __name__ == "__main__":
    asyncio.run(add_tee_times())
