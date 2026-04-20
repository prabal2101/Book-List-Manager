import { pgTable, text, serial, timestamp, boolean, pgEnum, integer, index } from "drizzle-orm/pg-core";
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
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  section: text("section").notNull(),
  rackNumber: text("rack_number").notNull(),
  rowNumber: text("row_number").notNull(),
  shelfNumber: text("shelf_number").notNull(),
  isbn: text("isbn"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("books_title_idx").on(table.title),
  index("books_author_idx").on(table.author),
  index("books_branch_idx").on(table.branch),
  index("books_availability_idx").on(table.availability),
  index("books_isbn_idx").on(table.isbn),
]);

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
