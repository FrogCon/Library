import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import cors from "cors";

const corsHandler = cors({ origin: true });

async function fetchBGG(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FrogCon/1.0 (contact: admin@frogcon)"
    }
  });
  return response.text();
}

/**
 * GET /getBGGCollection?username=XXXX
 */
export const getBGGCollection = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const username = req.query.username;
    if (!username) {
      return res.status(400).send("Missing username");
    }

    try {
      const url =
        `https://boardgamegeek.com/xmlapi2/collection` +
        `?username=${encodeURIComponent(username)}&own=1&version=1`;

      const xml = await fetchBGG(url);

      // Detect BGG queue message vs real data
      const isQueued =
        xml.includes("<message>") &&
        !xml.includes("<items");

      res.set("Content-Type", "text/xml");
      res.set("X-BGG-Queued", isQueued ? "true" : "false");
      res.send(xml);
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to fetch collection");
    }
  });
});

/**
 * GET /searchBGGGames?query=XXXX
 */
export const searchBGGGames = onRequest((req, res) => {
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
});

/**
 * GET /getBGGGameDetails?id=XXXX
 */
export const getBGGGameDetails = onRequest((req, res) => {
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
});
