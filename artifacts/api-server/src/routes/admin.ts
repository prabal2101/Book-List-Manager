import { Router, type IRouter } from "express";
import { eq, isNull, count, desc, and, gt } from "drizzle-orm";
import { db, usersTable, booksTable, borrowsTable } from "@workspace/db";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/dashboard", authenticate, requireRole("librarian", "admin"), async (_req, res): Promise<void> => {
  const now = new Date();

  const [totalBooksResult, totalUsersResult, activeBorrowsResult] = await Promise.all([
    db.select({ count: count() }).from(booksTable),
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(borrowsTable).where(isNull(borrowsTable.returnDate)),
  ]);

  const totalBooks = Number(totalBooksResult[0]?.count ?? 0);
  const totalUsers = Number(totalUsersResult[0]?.count ?? 0);
  const activeBorrows = Number(activeBorrowsResult[0]?.count ?? 0);

  const overdueBorrowsResult = await db.select({ count: count() }).from(borrowsTable)
    .where(and(isNull(borrowsTable.returnDate), gt(now, borrowsTable.dueDate)));
  const overdueBorrows = Number(overdueBorrowsResult[0]?.count ?? 0);

  const totalBorrowsResult = await db.select({ count: count() }).from(borrowsTable);
  const totalBorrowsAllTime = Number(totalBorrowsResult[0]?.count ?? 0);

  const allBooks = await db.select({
    branch: booksTable.branch,
    availability: booksTable.availability,
  }).from(booksTable);

  const branchMap: Record<string, { total: number; available: number; borrowed: number }> = {};
  for (const book of allBooks) {
    if (!branchMap[book.branch]) {
      branchMap[book.branch] = { total: 0, available: 0, borrowed: 0 };
    }
    branchMap[book.branch].total++;
    if (book.availability) {
      branchMap[book.branch].available++;
    } else {
      branchMap[book.branch].borrowed++;
    }
  }
  const branchStats = Object.entries(branchMap).map(([branch, stats]) => ({ branch, ...stats }));

  const mostBorrowedBooks = await db
    .select({
      id: booksTable.id,
      title: booksTable.title,
      author: booksTable.author,
      subject: booksTable.subject,
      branch: booksTable.branch,
      availability: booksTable.availability,
      section: booksTable.section,
      rackNumber: booksTable.rackNumber,
      rowNumber: booksTable.rowNumber,
      shelfNumber: booksTable.shelfNumber,
      isbn: booksTable.isbn,
      createdAt: booksTable.createdAt,
      borrowCount: count(borrowsTable.id),
    })
    .from(booksTable)
    .leftJoin(borrowsTable, eq(booksTable.id, borrowsTable.bookId))
    .groupBy(booksTable.id)
    .orderBy(desc(count(borrowsTable.id)))
    .limit(10);

  res.json({
    totalBooks,
    totalUsers,
    activeBorrows,
    overdueBorrows,
    totalBorrowsAllTime,
    branchStats,
    mostBorrowedBooks: mostBorrowedBooks.map((b) => ({ ...b, borrowCount: Number(b.borrowCount) })),
  });
});

router.get("/admin/activity", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { limit = 20 } = parsed.data;

  const borrows = await db.select({
    borrow: borrowsTable,
    book: booksTable,
    user: usersTable,
  }).from(borrowsTable)
    .leftJoin(booksTable, eq(borrowsTable.bookId, booksTable.id))
    .leftJoin(usersTable, eq(borrowsTable.userId, usersTable.id))
    .orderBy(desc(borrowsTable.createdAt))
    .limit(limit);

  const activities = borrows.map(({ borrow, book, user }, i) => {
    const isReturn = borrow.returnDate !== null;
    return {
      id: borrow.id * 100 + i,
      type: isReturn ? "return" : "borrow",
      description: isReturn
        ? `${user?.name ?? "Unknown"} returned "${book?.title ?? "Unknown"}"`
        : `${user?.name ?? "Unknown"} borrowed "${book?.title ?? "Unknown"}"`,
      userId: borrow.userId,
      userName: user?.name ?? "Unknown",
      bookTitle: book?.title ?? null,
      createdAt: isReturn ? (borrow.returnDate as Date) : borrow.borrowDate,
    };
  });

  res.json(activities);
});

router.get("/admin/users", authenticate, requireRole("admin"), async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));

  res.json(users);
});

export default router;
