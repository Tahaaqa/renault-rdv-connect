import { MongoClient, ObjectId } from "mongodb";
import { readFileSync } from "fs";

// Parse .env manually
const envContent = readFileSync(".env", "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
}

const uri = envVars.MONGODB_URI;
const dbName = envVars.MONGODB_DB_NAME;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  // Find the real user
  const user = await db.collection("users").findOne({
    keycloakSubject: "5cb228cf-4c08-400f-a439-4e1e86693760",
  });

  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }

  console.log(`Found user: ${user.firstName} ${user.lastName} (${user._id})`);

  // Find agencies
  const agencies = await db.collection("agencies").find().toArray();
  if (agencies.length === 0) {
    console.error("No agencies found! Run the main seed first.");
    process.exit(1);
  }
  console.log(`Found ${agencies.length} agencies`);

  // Insert vehicles for this user
  const vehiclesDocs = [
    {
      _id: new ObjectId(),
      ownerUserId: user._id,
      plateNumber: "198 TN 7721",
      brand: "Renault",
      model: "Clio V",
      year: 2023,
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      ownerUserId: user._id,
      plateNumber: "45 TN 3389",
      brand: "Renault",
      model: "Captur",
      year: 2021,
      isPrimary: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Check if vehicles already exist
  const existingVehicles = await db
    .collection("vehicles")
    .countDocuments({ ownerUserId: user._id });
  if (existingVehicles > 0) {
    console.log(`User already has ${existingVehicles} vehicles, skipping...`);
  } else {
    await db.collection("vehicles").insertMany(vehiclesDocs);
    console.log(`Inserted ${vehiclesDocs.length} vehicles`);
  }

  // Get the user's vehicles (whether just inserted or pre-existing)
  const vehicles = await db
    .collection("vehicles")
    .find({ ownerUserId: user._id })
    .toArray();

  // Insert appointments
  const existingAppts = await db
    .collection("appointments")
    .countDocuments({ clientUserId: user._id });
  if (existingAppts > 0) {
    console.log(`User already has ${existingAppts} appointments, skipping...`);
  } else {
    const apptCount = await db.collection("appointments").countDocuments();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    lastMonth.setHours(11, 0, 0, 0);

    const apptDocs = [
      {
        _id: new ObjectId(),
        reference: `RDV-${now.getFullYear()}-${String(apptCount + 1).padStart(5, "0")}`,
        clientUserId: user._id,
        agencyId: agencies[0]._id,
        vehicleId: vehicles[0]._id,
        startsAt: tomorrow,
        status: "Confirme",
        notes: "Vidange et révision des 30 000 km",
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        reference: `RDV-${now.getFullYear()}-${String(apptCount + 2).padStart(5, "0")}`,
        clientUserId: user._id,
        agencyId: agencies[0]._id,
        vehicleId: vehicles[1]._id,
        startsAt: nextWeek,
        status: "EnAttente",
        notes: "Bruit au niveau du freinage",
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        reference: `RDV-${now.getFullYear()}-${String(apptCount + 3).padStart(5, "0")}`,
        clientUserId: user._id,
        agencyId: agencies[1]._id,
        vehicleId: vehicles[0]._id,
        startsAt: lastMonth,
        status: "Termine",
        notes: "Changement des plaquettes de frein",
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection("appointments").insertMany(apptDocs);
    console.log(`Inserted ${apptDocs.length} appointments`);
  }

  // Insert complaints
  const existingComplaints = await db
    .collection("complaints")
    .countDocuments({ clientUserId: user._id });
  if (existingComplaints > 0) {
    console.log(
      `User already has ${existingComplaints} complaints, skipping...`
    );
  } else {
    const userAppts = await db
      .collection("appointments")
      .find({ clientUserId: user._id })
      .toArray();
    const complaintDocs = [
      {
        _id: new ObjectId(),
        clientUserId: user._id,
        appointmentId: userAppts[2]?._id ?? null,
        description:
          "Le problème de freinage n'a pas été correctement résolu lors de ma dernière visite.",
        status: "Ouverte",
        resolution: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.collection("complaints").insertMany(complaintDocs);
    console.log(`Inserted ${complaintDocs.length} complaints`);
  }

  // Insert notifications
  const existingNotifs = await db
    .collection("notifications")
    .countDocuments({ userId: user._id });
  if (existingNotifs > 0) {
    console.log(
      `User already has ${existingNotifs} notifications, skipping...`
    );
  } else {
    const notifDocs = [
      {
        _id: new ObjectId(),
        userId: user._id,
        type: "rdv_confirme",
        message: "Votre rendez-vous de demain à 10h00 a été confirmé",
        read: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        userId: user._id,
        type: "rdv_rappel",
        message: "Rappel : RDV demain à Renault Tunis-Centre",
        read: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.collection("notifications").insertMany(notifDocs);
    console.log(`Inserted ${notifDocs.length} notifications`);
  }

  console.log("\n✅ Done! Refresh your browser to see the data.");
  await client.close();
}

main().catch(console.error);
