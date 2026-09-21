import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.ts';
import { MeasurementProfile } from '../models/MeasurementProfile.model.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export async function deduplicateMeasurementProfiles(): Promise<number> {
  await connectDB();

  console.log('Scanning for duplicate MeasurementProfile records...');

  // Group by customer and clothingCategory
  const rawDups = await MeasurementProfile.aggregate([
    {
      $group: {
        _id: { customer: '$customer', clothingCategory: '$clothingCategory' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  let removedCount = 0;

  for (const group of rawDups) {
    const ids: mongoose.Types.ObjectId[] = group.ids;
    console.log(`Found ${group.count} profiles for customer ${group._id.customer}, category ${group._id.clothingCategory}`);
    // Keep the most recently updated profile, delete others
    const docs = await MeasurementProfile.find({ _id: { $in: ids } }).sort({ updatedAt: -1, createdAt: -1 });
    const [keepDoc, ...deleteDocs] = docs;
    const idsToDelete = deleteDocs.map((d) => d._id);
    if (idsToDelete.length > 0) {
      await MeasurementProfile.deleteMany({ _id: { $in: idsToDelete } });
      removedCount += idsToDelete.length;
      console.log(`  ✓ Preserved latest profile ${keepDoc._id}, removed ${idsToDelete.length} duplicates.`);
    }
  }

  // Synchronize daman <-> ghera across all profiles
  const allProfiles = await MeasurementProfile.find({});
  let syncedCount = 0;
  for (const p of allProfiles) {
    if (p.measurements?.qameez) {
      const q = p.measurements.qameez as any;
      if (q.ghera && !q.daman) {
        q.daman = q.ghera;
        p.markModified('measurements');
        await p.save();
        syncedCount++;
      } else if (q.daman && !q.ghera) {
        q.ghera = q.daman;
        p.markModified('measurements');
        await p.save();
        syncedCount++;
      }
    }
  }

  console.log(`Deduplication complete. Removed ${removedCount} duplicates. Synced ${syncedCount} daman/ghera fields.`);
  return removedCount;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deduplicateMeasurementProfiles()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Migration failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
