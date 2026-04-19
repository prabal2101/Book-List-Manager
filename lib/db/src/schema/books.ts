import { pgTable, text, serial, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const branchEnum = pgEnum("branch", ["CSE", "IT", "Civil", "Mechanical", "Electrical"]);

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  subject: text("subject").notNull(),
  branch: branchEnum("branch").notNull(),
  availability: boolean("availability").notNull().default(true),
  section: text("section").notNull(),
  rackNumber: text("rack_number").notNull(),
  rowNumber: text("row_number").notNull(),
  shelfNumber: text("shelf_number").notNull(),
  isbn: text("isbn"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
