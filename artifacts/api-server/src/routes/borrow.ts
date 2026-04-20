import { Router, type IRouter } from "express";
import { eq, and, isNull, desc, count, sql } from "drizzle-orm";
import { db, borrowsTable, booksTable, usersTable } from "@workspace/db";
import {
  BorrowBookBody,
  ReturnBookBody,
  GetBorrowHistoryQueryParams,
} from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function formatBorrowRecord(borrow: typeof borrowsTable.$inferSelect, book: typeof booksTable.$inferSelect | null, user: typeof usersTable.$inferSelect | null) {
  const now = new Date();
  const isOverdue = !borrow.returnDate && borrow.dueDate < now;
  const fineDays = isOverdue ? Math.floor((now.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return {
    id: borrow.id,
    userId: borrow.userId,
    bookId: borrow.bookId,
    book: book || undefined,
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } : undefined,
    borrowDate: borrow.borrowDate,
    dueDate: borrow.dueDate,
    returnDate: borrow.returnDate || null,
    isOverdue,
    fineDays,
  };
}

router.post("/borrow", authenticate, async (req, res): Promise<void> => {
  const parsed = BorrowBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const { bookId, dueDays = 14 } = parsed.data;
  const userId = req.user!.userId;

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  if (book.availableCopies <= 0) {
    res.status(400).json({ error: "No copies available for borrowing" });
    return;
  }

  const existing = await db.select().from(borrowsTable)
    .where(and(eq(borrowsTable.userId, userId), eq(borrowsTable.bookId, bookId), isNull(borrowsTable.returnDate)));

  if (existing.length > 0) {
    res.status(400).json({ error: "You have already borrowed this book" });
    return;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const [borrow] = await db.insert(borrowsTable).values({
    userId,
    bookId,
    dueDate,
  }).returning();

  const newAvailable = book.availableCopies - 1;
  await db.update(booksTable)
    .set({
      availableCopies: newAvailable,
      availability: newAvailable > 0,
    })
    .where(eq(booksTable.id, bookId));

  const [updatedBook] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));

  res.status(201).json(formatBorrowRecord(borrow, updatedBook, null));
});

router.post("/borrow/return", authenticate, async (req, res): Promise<void> => {
  const parsed = ReturnBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const { borrowId } = parsed.data;
  const userId = req.user!.userId;

  const [borrow] = await db.select().from(borrowsTable).where(eq(borrowsTable.id, borrowId));
  if (!borrow) {
    res.status(404).json({ error: "Borrow record not found" });
    return;
  }

  if (borrow.userId !== userId && req.user!.role === "student") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (borrow.returnDate) {
    res.status(400).json({ error: "Book already returned" });
    return;
  }

  const [updated] = await db.update(borrowsTable)
    .set({ returnDate: new Date() })
    .where(eq(borrowsTable.id, borrowId))
    .returning();

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, borrow.bookId));
  if (book) {
    const newAvailable = Math.min(book.availableCopies + 1, book.totalCopies);
    await db.update(booksTable)
      .set({
        availableCopies: newAvailable,
        availability: true,
      })
      .where(eq(booksTable.id, borrow.bookId));
  }

  const [updatedBook] = await db.select().from(booksTable).where(eq(booksTable.id, borrow.bookId));

  res.json(formatBorrowRecord(updated, updatedBook, null));
});

router.get("/borrow", authenticate, async (req, res): Promise<void> => {
  const parsed = GetBorrowHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  const [records, totalResult] = await Promise.all([
    db.select({
      borrow: borrowsTable,
      book: booksTable,
    }).from(borrowsTable)
      .leftJoin(booksTable, eq(borrowsTable.bookId, booksTable.id))
      .where(eq(borrowsTable.userId, userId))
      .orderBy(desc(borrowsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(borrowsTable).where(eq(borrowsTable.userId, userId)),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  const formatted = records.map(({ borrow, book }) => formatBorrowRecord(borrow, book, null));

  res.json({ records: formatted, total, page, limit, totalPages });
});

router.get("/borrow/active", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const records = await db.select({
    borrow: borrowsTable,
    book: booksTable,
    user: usersTable,
  }).from(borrowsTable)
    .leftJoin(booksTable, eq(borrowsTable.bookId, booksTable.id))
    .leftJoin(usersTable, eq(borrowsTable.userId, usersTable.id))
    .where(isNull(borrowsTable.returnDate))
    .orderBy(desc(borrowsTable.borrowDate));

  const formatted = records.map(({ borrow, book, user }) => formatBorrowRecord(borrow, book, user));

  res.json(formatted);
});

export default router;
