import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import cors from "cors";

const BGG_TOKEN = defineSecret("BGG_TOKEN");
const corsHandler = cors({ origin: true });

/**
 * Native fetch helper (Node 18+ / 20 / 24)
 */
async function fetchBGG(url) {
  console.log("fetchBGG() using native fetch");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FrogCon/1.0 (contact: admin@frogcon)",
      "Accept": "application/xml,text/xml,*/*",
      "Authorization": `Bearer ${BGG_TOKEN.value()}`
    }
  });

  console.log("BGG HTTP status:", response.status);
  console.log("BGG content-type:", response.headers.get("content-type"));

  const xml = await response.text();

  console.log("BGG body length:", xml.length);

  return xml;
}

/**
 * GET /getBGGCollection?username=XXXX
 * Server-side queue detection (NO frontend changes)
 */
export const getBGGCollection = onRequest(
  { secrets: [BGG_TOKEN] },
  (req, res) => {
    corsHandler(req, res, async () => {
      console.log("=== getBGGCollection START ===");

      const username = req.query.username;
      console.log("Username:", username);

      if (!username) {
        console.log("ERROR: Missing username");
        return res.status(400).send("Missing username");
      }

      try {
        const url =
          `https://boardgamegeek.com/xmlapi2/collection` +
          `?username=${encodeURIComponent(username)}&own=1&version=1`;

        console.log("Fetching BGG URL:", url);

        const xml = await fetchBGG(url);

        console.log("BGG response length:", xml.length);

        console.log(
          "BGG response preview:",
          xml.substring(0, 500).replace(/\n/g, " ")
        );

        const hasItems = xml.includes("<items");
        const hasMessage = xml.includes("<message");

        console.log("BGG has <items>:", hasItems);
        console.log("BGG has <message>:", hasMessage);

        const isQueued = hasMessage && !hasItems;

        console.log("BGG queued:", isQueued);

        res.set("Content-Type", "text/xml");
        res.set("X-BGG-Queued", isQueued ? "true" : "false");

        console.log("Sending response back to client");
        console.log("=== getBGGCollection END ===");

        res.send(xml);
      } catch (err) {
        console.error("ERROR fetching BGG collection:", err);
        res.status(500).send("Failed to fetch collection");
      }
    });
  }
);

/**
 * GET /searchBGGGames?query=XXXX
 */
export const searchBGGGames = onRequest(
  { secrets: [BGG_TOKEN] },
  (req, res) => {
    corsHandler(req, res, async () => {
      const query = req.query.query;
      if (!query) {
        return res.status(400).send("Missing query");
      }

      try {
        const url =
          `https://boardgamegeek.com/xmlapi2/search` +
          `?query=${encodeURIComponent(query)}&type=boardgame`;

        const xml = await fetchBGG(url);
        res.set("Content-Type", "text/xml");
        res.send(xml);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to search games");
      }
    });
  }
);

/**
 * GET /getBGGGameDetails?id=XXXX
 */
export const getBGGGameDetails = onRequest(
  { secrets: [BGG_TOKEN] },
  (req, res) => {
    corsHandler(req, res, async () => {
      const id = req.query.id;
      if (!id) {
        return res.status(400).send("Missing id");
      }

      try {
        const url =
          `https://boardgamegeek.com/xmlapi2/thing` +
          `?id=${encodeURIComponent(id)}&versions=1`;

        const xml = await fetchBGG(url);
        res.set("Content-Type", "text/xml");
        res.send(xml);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch game details");
      }
    });
  }
);
