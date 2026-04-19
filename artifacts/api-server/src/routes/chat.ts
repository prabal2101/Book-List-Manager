import { Router, type IRouter } from "express";
import { db, booksTable } from "@workspace/db";
import { ChatBody } from "@workspace/api-zod";
import { authenticate } from "../middlewares/auth";
import { ilike, or, eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function getBookContext(message: string): Promise<string> {
  try {
    const lowerMsg = message.toLowerCase();
    const searchTerms: string[] = [];

    const locationMatch = message.match(/where is (.+?)(\?|$)/i);
    if (locationMatch) {
      searchTerms.push(locationMatch[1].trim());
    }

    const suggestMatch = message.match(/suggest (.+?) books/i);
    if (suggestMatch) {
      searchTerms.push(suggestMatch[1].trim());
    }

    if (searchTerms.length === 0) {
      const words = lowerMsg.split(/\s+/).filter((w) => w.length > 3);
      searchTerms.push(...words.slice(0, 3));
    }

    if (searchTerms.length === 0) {
      return "";
    }

    const searchTerm = searchTerms[0];
    const books = await db.select().from(booksTable)
      .where(
        or(
          ilike(booksTable.title, `%${searchTerm}%`),
          ilike(booksTable.subject, `%${searchTerm}%`),
          ilike(booksTable.author, `%${searchTerm}%`),
          ilike(booksTable.branch, `%${searchTerm}%`)
        )
      )
      .limit(5);

    if (books.length === 0) return "";

    const bookInfo = books.map((b) =>
      `- "${b.title}" by ${b.author} (${b.branch}, ${b.subject}) — ${b.availability ? "Available" : "Borrowed"} — Location: Section ${b.section}, Rack ${b.rackNumber}, Row ${b.rowNumber}, Shelf ${b.shelfNumber}`
    ).join("\n");

    return `\n\nRelevant books from the library database:\n${bookInfo}`;
  } catch {
    return "";
  }
}

router.post("/chat", authenticate, async (req, res): Promise<void> => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", message: parsed.error.message });
    return;
  }

  const { message, conversationHistory = [] } = parsed.data;

  const bookContext = await getBookContext(message);

  const systemPrompt = `You are an intelligent library assistant for a university library management system. You help students and staff with:
1. Finding books and their physical locations (Section, Rack, Row, Shelf)
2. Recommending books by branch (CSE, IT, Civil, Mechanical, Electrical) or subject
3. Answering questions about library policies, borrowing, and due dates
4. Providing study resource suggestions

Be helpful, concise, and friendly. When mentioning book locations, format them clearly as "Section X, Rack Y, Row Z, Shelf W".${bookContext}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const fallbackResponse = generateFallbackResponse(message, bookContext);
    res.json({ message: fallbackResponse, role: "assistant" });
    return;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, "OpenAI API error");
      const fallbackResponse = generateFallbackResponse(message, bookContext);
      res.json({ message: fallbackResponse, role: "assistant" });
      return;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string; role: string } }>;
    };

    const assistantMessage = data.choices[0]?.message?.content || "I could not generate a response.";
    res.json({ message: assistantMessage, role: "assistant" });
  } catch (err) {
    logger.error({ err }, "Error calling OpenAI");
    const fallbackResponse = generateFallbackResponse(message, bookContext);
    res.json({ message: fallbackResponse, role: "assistant" });
  }
});

function generateFallbackResponse(message: string, bookContext: string): string {
  const lowerMsg = message.toLowerCase();

  if (bookContext) {
    return `Based on your query, here are some relevant books I found in our library:\n${bookContext.replace("\n\nRelevant books from the library database:\n", "")}\n\nYou can search for more books using the Books section of the library system.`;
  }

  if (lowerMsg.includes("borrow") || lowerMsg.includes("checkout")) {
    return "To borrow a book, find it in the Books section and click the Borrow button. Books can be borrowed for 14 days by default. Make sure to return them on time to avoid overdue charges.";
  }

  if (lowerMsg.includes("return")) {
    return "To return a book, go to your Borrow History page and click the Return button next to the book you want to return. The book will become available for others immediately.";
  }

  if (lowerMsg.includes("find") || lowerMsg.includes("where") || lowerMsg.includes("location")) {
    return "To find a book's physical location, search for it in the Books section. Each book listing shows its Section, Rack Number, Row Number, and Shelf Number to help you locate it in the library.";
  }

  if (lowerMsg.includes("cse") || lowerMsg.includes("computer")) {
    return "For CSE books, use the filter in the Books section to filter by 'CSE' branch. You'll find books on Data Structures, Algorithms, Operating Systems, Databases, and more.";
  }

  return "I can help you find books, check their location, or answer questions about borrowing. Try asking me to 'suggest CSE books' or 'where is the DBMS book?' for example.";
}

export default router;
