import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, desc, count } from "drizzle-orm";
import { db, booksTable, borrowsTable } from "@workspace/db";
import {
  CreateBookBody,
  UpdateBookBody,
  UpdateBookParams,
  GetBookParams,
  DeleteBookParams,
  GetBooksQueryParams,
  BulkUploadBooksBody,
  GetPopularBooksQueryParams,
} from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/books", async (req, res): Promise<void> => {
  const parsed = GetBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params", message: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, search, branch, subject, availability, author } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${ilike(booksTable.title, `%${search}%`)} OR ${ilike(booksTable.author, `%${search}%`)} OR ${ilike(booksTable.subject, `%${search}%`)} OR ${ilike(booksTable.isbn, `%${search}%`)})`
    );
  }
  if (branch) {
    conditions.push(eq(booksTable.branch, branch as "CSE" | "IT" | "Civil" | "Mechanical" | "Electrical"));
  }
  if (subject) {
    conditions.push(ilike(booksTable.subject, `%${subject}%`));
  }
  if (availability !== undefined) {
    conditions.push(eq(booksTable.availability, availability));
  }
  if (author) {
    conditions.push(ilike(booksTable.author, `%${author}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [books, totalResult] = await Promise.all([
    db.select().from(booksTable)
      .where(whereClause)
      .orderBy(desc(booksTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(booksTable).where(whereClause),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  res.json({ books, total, page, limit, totalPages });
});

router.get("/books/stats", async (_req, res): Promise<void> => {
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

  const branches = Object.entries(branchMap).map(([branch, stats]) => ({ branch, ...stats }));
  const totalBooks = allBooks.length;
  const availableBooks = allBooks.filter((b) => b.availability).length;
  const borrowedBooks = totalBooks - availableBooks;

  res.json({ branches, totalBooks, availableBooks, borrowedBooks });
});

router.get("/books/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { branch, limit = 10 } = parsed.data;

  const query = db
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
    .limit(limit);

  if (branch) {
    const results = await query.where(eq(booksTable.branch, branch as "CSE" | "IT" | "Civil" | "Mechanical" | "Electrical"));
    res.json(results.map((r) => ({ ...r, borrowCount: Number(r.borrowCount) })));
  } else {
    const results = await query;
    res.json(results.map((r) => ({ ...r, borrowCount: Number(r.borrowCount) })));
  }
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, params.data.id));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(book);
});

router.post("/books", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const [book] = await db.insert(booksTable).values({
    ...parsed.data,
    availability: parsed.data.availability ?? true,
  }).returning();

  res.status(201).json(book);
});

router.post("/books/bulk-upload", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const parsed = BulkUploadBooksBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const { csvData } = parsed.data;
  const lines = csvData.trim().split("\n");
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  const startIndex = lines[0].toLowerCase().includes("title") ? 1 : 0;
  const dataLines = lines.slice(startIndex);

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [title, author, subject, branch, section, rackNumber, rowNumber, shelfNumber, isbn] = cols;

    if (!title || !author || !subject || !branch || !section || !rackNumber || !rowNumber || !shelfNumber) {
      errors.push(`Row ${startIndex + i + 1}: Missing required fields`);
      failed++;
      continue;
    }

    const validBranches = ["CSE", "IT", "Civil", "Mechanical", "Electrical"];
    if (!validBranches.includes(branch)) {
      errors.push(`Row ${startIndex + i + 1}: Invalid branch "${branch}". Must be one of: ${validBranches.join(", ")}`);
      failed++;
      continue;
    }

    try {
      await db.insert(booksTable).values({
        title,
        author,
        subject,
        branch: branch as "CSE" | "IT" | "Civil" | "Mechanical" | "Electrical",
        availability: true,
        section,
        rackNumber,
        rowNumber,
        shelfNumber,
        isbn: isbn || null,
      });
      inserted++;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Row ${startIndex + i + 1}: ${errMsg}`);
      failed++;
    }
  }

  res.json({ inserted, failed, errors, total: dataLines.filter((l) => l.trim()).length });
});

router.put("/books/:id", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const params = UpdateBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }

  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const [book] = await db.update(booksTable)
    .set(parsed.data)
    .where(eq(booksTable.id, params.data.id))
    .returning();

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(book);
});

router.delete("/books/:id", authenticate, requireRole("librarian", "admin"), async (req, res): Promise<void> => {
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }

  const [book] = await db.delete(booksTable).where(eq(booksTable.id, params.data.id)).returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json({ success: true, message: "Book deleted successfully" });
});

export default router;
