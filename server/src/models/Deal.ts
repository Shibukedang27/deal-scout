import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  title: string;
  price: number;
  priceDisplay: string;
  currency: string;
  link: string;
  source: string;
  scrapedAt: Date;
}

const dealSchema = new Schema<IDeal>({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  priceDisplay: { type: String, required: true },
  currency: { type: String, required: true, default: 'INR' },
  link: { type: String, required: true },
  source: { type: String, required: true },
  scrapedAt: { type: Date, required: true },
});

// same deal from same source shouldn't duplicate
dealSchema.index({ source: 1, link: 1 }, { unique: true });

export const Deal = mongoose.model<IDeal>('Deal', dealSchema);
