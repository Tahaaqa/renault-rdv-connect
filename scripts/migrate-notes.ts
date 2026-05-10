import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const databaseName = process.env.MONGO_DB ?? process.env.MONGO_DATABASE ?? "renault-rdv-connect";

if (!uri) {
  throw new Error("MONGO_URI is required");
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(databaseName);
  const appointments = db.collection("appointments");
  const cursor = appointments.find({ notes: { $exists: true, $ne: null } });
  let migrated = 0;

  for await (const rdv of cursor) {
    const notesLibres = String(rdv.notes ?? "").trim();
    await appointments.updateOne(
      { _id: rdv._id },
      {
        $set: {
          notesLibres,
          servicesSelectionnes: notesLibres
            ? [...new Set([...(rdv.servicesSelectionnes ?? []), "Autre"])]
            : (rdv.servicesSelectionnes ?? []),
          updatedAt: new Date(),
        },
        $unset: { notes: "" },
      },
    );
    migrated++;
  }

  console.log(`Migrated ${migrated} appointments.`);
} finally {
  await client.close();
}
