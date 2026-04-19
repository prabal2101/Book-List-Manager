import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistsTable, booksTable } from "@workspace/db";
import { AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/wishlist", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const items = await db.select({
    wishlist: wishlistsTable,
    book: booksTable,
  }).from(wishlistsTable)
    .leftJoin(booksTable, eq(wishlistsTable.bookId, booksTable.id))
    .where(eq(wishlistsTable.userId, userId));

  const formatted = items.map(({ wishlist, book }) => ({
    id: wishlist.id,
    userId: wishlist.userId,
    bookId: wishlist.bookId,
    book: book || undefined,
    createdAt: wishlist.createdAt,
  }));

  res.json(formatted);
});

router.post("/wishlist", authenticate, async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const { bookId } = parsed.data;

  const existing = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.bookId, bookId)));

  if (existing.length > 0) {
    res.status(400).json({ error: "Book already in wishlist" });
    return;
  }

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const [item] = await db.insert(wishlistsTable).values({ userId, bookId }).returning();

  res.status(201).json({
    id: item.id,
    userId: item.userId,
    bookId: item.bookId,
    book,
    createdAt: item.createdAt,
  });
});

router.delete("/wishlist/:bookId", authenticate, async (req, res): Promise<void> => {
  const params = RemoveFromWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid book ID" });
    return;
  }

  const userId = req.user!.userId;
  const { bookId } = params.data;

  const [deleted] = await db.delete(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, userId), eq(wishlistsTable.bookId, bookId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Wishlist item not found" });
    return;
  }

  res.json({ success: true, message: "Removed from wishlist" });
});

export default router;
