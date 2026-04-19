import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import borrowRouter from "./borrow";
import wishlistRouter from "./wishlist";
import chatRouter from "./chat";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(borrowRouter);
router.use(wishlistRouter);
router.use(chatRouter);
router.use(adminRouter);

export default router;
