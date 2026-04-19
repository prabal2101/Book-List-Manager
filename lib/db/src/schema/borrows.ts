import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const borrowsTable = pgTable("borrows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bookId: integer("book_id").notNull().references(() => booksTable.id),
  borrowDate: timestamp("borrow_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBorrowSchema = createInsertSchema(borrowsTable).omit({ id: true, createdAt: true });
export type InsertBorrow = z.infer<typeof insertBorrowSchema>;
export type Borrow = typeof borrowsTable.$inferSelect;
