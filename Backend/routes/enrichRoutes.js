import express from "express";
import axios from "axios";
import Enrichment from "../models/Enrichment.js";

const router = express.Router();

// Get enrichment by company ID
router.get("/:companyId", async (req, res) => {
  try {
    const enrichment = await Enrichment.findOne({ companyId: req.params.companyId });
    if (!enrichment) {
      return res.status(404).json({ error: "Enrichment not found" });
    }
    res.json(enrichment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch enrichment" });
  }
});

// Create or get enrichment
router.post("/", async (req, res) => {
  const { website, companyId } = req.body;

  // Check cache first
  const cached = await Enrichment.findOne({ companyId });
  if (cached) return res.json(cached);

  if (!website) {
    return res.status(400).json({ error: "Website is required" });
  }

  try {
    let pageText = "";
    
    // Try Firecrawl first (requires API key)
    if (process.env.FIRECRAWL_KEY) {
      try {
        const scrape = await axios.post(
          "https://api.firecrawl.dev/v1/scrape",
          { url: website, formats: ["markdown", "html"] },
          { headers: { Authorization: `Bearer ${process.env.FIRECRAWL_KEY}` } }
        );
        pageText = (scrape.data.data?.markdown || scrape.data.data?.text || "").slice(0, 8000);
      } catch (e) {
        console.log("Firecrawl failed, trying basic fetch");
      }
    }

    // Fallback to basic axios fetch
    if (!pageText) {
      try {
        const fetch = await axios.get(website, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        // Extract text from HTML (simple approach)
        pageText = fetch.data
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<style[^>]*>.*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 8000);
      } catch (e) {
        console.log("Basic fetch also failed");
      }
    }

    if (!pageText) {
      return res.status(500).json({ error: "Could not fetch website content" });
    }

    // Use AI extraction if OpenAI key is available
    let extractedData = {
      summary: "Company data extracted from website.",
      bullets: ["Data extracted from company website"],
      keywords: ["technology", "software"],
      signals: ["Website found"]
    };

    if (process.env.OPENAI_KEY) {
      try {
        const ai = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a VC analyst. Extract company information from the text provided. 
                Return JSON with exactly this structure:
                {
                  "summary": "1-2 sentence summary of what the company does",
                  "bullets": ["3-6 bullet points about what they do"],
                  "keywords": ["5-10 keywords"],
                  "signals": ["2-4 signals like: blog exists, hiring page, docs, API, pricing page, etc."]
                }`
              },
              {
                role: "user",
                content: `Extract company information from this website text:\n\n${pageText}`
              }
            ],
            response_format: { type: "json_object" }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const aiResult = JSON.parse(ai.data.choices[0].message.content);
        extractedData = {
          summary: aiResult.summary || extractedData.summary,
          bullets: aiResult.bullets || extractedData.bullets,
          keywords: aiResult.keywords || extractedData.keywords,
          signals: aiResult.signals || extractedData.signals
        };
      } catch (e) {
        console.log("AI extraction failed:", e.message);
        // Use basic extraction from page text
        extractedData = extractBasicData(pageText);
      }
    } else {
      // Use basic extraction
      extractedData = extractBasicData(pageText);
    }

    const result = {
      companyId,
      summary: extractedData.summary,
      bullets: extractedData.bullets,
      keywords: extractedData.keywords,
      signals: extractedData.signals,
      sources: [website],
      timestamp: new Date()
    };

    const saved = await Enrichment.create(result);
    res.json(saved);
  } catch (err) {
    console.log("Enrichment error:", err.message);
    res.status(500).json({ error: "Enrichment failed: " + err.message });
  }
});

// Basic extraction when no AI
function extractBasicData(text) {
  const lowerText = text.toLowerCase();
  
  const signals = [];
  if (lowerText.includes("blog")) signals.push("Blog exists");
  if (lowerText.includes("career") || lowerText.includes("hiring") || lowerText.includes("jobs")) signals.push("Hiring page");
  if (lowerText.includes("docs") || lowerText.includes("documentation")) signals.push("Documentation");
  if (lowerText.includes("api")) signals.push("Has API");
  if (lowerText.includes("pricing") || lowerText.includes("price")) signals.push("Pricing page");
  if (lowerText.includes("contact") || lowerText.includes("about")) signals.push("Contact page");
  if (lowerText.includes("demo")) signals.push("Demo available");

  return {
    summary: text.slice(0, 200) + "...",
    bullets: text.slice(0, 500).split(". ").slice(0, 3).map(s => s.trim()),
    keywords: ["technology", "software", "platform"].slice(0, Math.floor(Math.random() * 5) + 5),
    signals: signals.length > 0 ? signals : ["Website found"]
  };
}

export default router;
