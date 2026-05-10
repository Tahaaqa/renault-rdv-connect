import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const AGENCIES = [
  {
    name: "Renault Tunis-Centre",
    city: "Tunis",
    address: "Avenue Habib Bourguiba, Tunis 1000",
    phone: "+216 71 234 567",
    location: { lat: 36.8065, lng: 10.1815 },
  },
  {
    name: "Renault Sfax",
    city: "Sfax",
    address: "Route de Tunis Km 0.5, Sfax 3000",
    phone: "+216 74 456 789",
    location: { lat: 34.7406, lng: 10.7603 },
  },
  {
    name: "Renault Sousse",
    city: "Sousse",
    address: "Boulevard 14 Janvier, Sousse 4000",
    phone: "+216 73 678 901",
    location: { lat: 35.8245, lng: 10.6346 },
  },
  {
    name: "Renault Monastir",
    city: "Monastir",
    address: "Zone Industrielle Monastir 5000",
    phone: "+216 73 890 123",
    location: { lat: 35.7643, lng: 10.8113 },
  },
  {
    name: "Renault Bizerte",
    city: "Bizerte",
    address: "Avenue Farhat Hached, Bizerte 7000",
    phone: "+216 72 012 345",
    location: { lat: 37.2746, lng: 9.8739 },
  },
  {
    name: "Renault Gabès",
    city: "Gabès",
    address: "Route Nationale 1, Gabès 6000",
    phone: "+216 75 234 567",
    location: { lat: 33.8843, lng: 10.0982 },
  },
  {
    name: "Renault Nabeul",
    city: "Nabeul",
    address: "Avenue Habib Thameur, Nabeul 8000",
    phone: "+216 72 345 678",
    location: { lat: 36.4513, lng: 10.7357 },
  },
  {
    name: "Renault Kairouan",
    city: "Kairouan",
    address: "Route de Tunis, Kairouan 3100",
    phone: "+216 77 456 789",
    location: { lat: 35.6781, lng: 10.0963 },
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const dbName = process.env.MONGODB_DB_NAME;
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const collection = db.collection("agencies");

  for (const agency of AGENCIES) {
    await collection.updateOne(
      { name: agency.name },
      { $set: agency, $setOnInsert: { createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`✅ Seeded: ${agency.name}`);
  }

  await client.close();
  console.log("All agencies seeded with coordinates.");
}

seed().catch(console.error);
