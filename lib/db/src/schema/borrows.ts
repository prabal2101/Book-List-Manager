import { pgTable, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
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
}, (table) => [
  index("borrows_user_id_idx").on(table.userId),
  index("borrows_book_id_idx").on(table.bookId),
  index("borrows_return_date_idx").on(table.returnDate),
]);

export const insertBorrowSchema = createInsertSchema(borrowsTable).omit({ id: true, createdAt: true });
export type InsertBorrow = z.infer<typeof insertBorrowSchema>;
export type Borrow = typeof borrowsTable.$inferSelect;
