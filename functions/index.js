const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Utility: fetch with retry (handles BGG 202 queue)
 */
async function fetchWithRetry(url, retries = 5, delay = 10000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FrogCon/1.0 (admin@frogcon)"
      }
    });

    if (res.status === 202) {
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    return res.text();
  }

  throw new Error("BGG request timed out after retries");
}

/**
 * Generic BGG proxy with caching
 */
exports.bggProxy = functions.https.onRequest(async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).send("Missing type");
    }

    let url;
    let cacheKey;

    switch (type) {
      case "collection": {
        const username = req.query.username;
        if (!username) return res.status(400).send("Missing username");
        url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&version=1`;
        cacheKey = `collection_${username}`;
        break;
      }

      case "search": {
        const query = req.query.query;
        if (!query) return res.status(400).send("Missing query");
        url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
        cacheKey = `search_${query}`;
        break;
      }

      case "thing": {
        const id = req.query.id;
        if (!id) return res.status(400).send("Missing id");
        url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&versions=1`;
        cacheKey = `thing_${id}`;
        break;
      }

      default:
        return res.status(400).send("Invalid type");
    }

    // 🔹 Check cache (15 minutes)
    const cacheRef = db.collection("bggCache").doc(cacheKey);
    const cached = await cacheRef.get();

    if (cached.exists) {
      const { xml, timestamp } = cached.data();
      if (Date.now() - timestamp < 15 * 60 * 1000) {
        res.set("Content-Type", "text/xml");
        return res.send(xml);
      }
    }

    // 🔹 Fetch from BGG
    const xml = await fetchWithRetry(url);

    // 🔹 Store cache
    await cacheRef.set({
      xml,
      timestamp: Date.now()
    });

    res.set("Content-Type", "text/xml");
    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send("BGG fetch failed");
  }
});