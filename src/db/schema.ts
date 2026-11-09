import { pgTable, serial, varchar, integer, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  nim: varchar('nim', { length: 15 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  streetName: varchar('street_name', { length: 255 }), // jalan atau nama gang
  houseNumber: varchar('house_number', { length: 5 }),
  rt: varchar('rt', { length: 5 }).notNull(),
  headOfFamilyName: varchar('head_of_family_name', { length: 255 }).notNull(),
  numberOfFamilyMembers: varchar('number_of_family_members', { length: 5 }).notNull(),
  isSortingWaste: varchar('is_sorting_waste', { length: 100 }), // ya, tidak, sebagian
  userId: integer('user_id').references(() => users.id, { onDelete: 'restrict' }),
  imageUrl: varchar('image_url', { length: 255 }), // todo: migrate
  imagePublicId: varchar('image_public_id', { length: 255 }), // todo: migrate
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const wastes = pgTable('wastes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'restrict' }),
  houseId: integer('house_id').references(() => houses.id, { onDelete: 'restrict' }),
  weight: decimal('weight').notNull(),
  typesOfWaste: varchar('types_of_waste').notNull(), // organik, nonorganik, residu, lainnya
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});