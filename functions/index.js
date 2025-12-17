const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

/**
 * Utility: fetch with retry (handles BGG 202 queue)
 */
async function fetchWithRetry(url, retries = 8, delay = 15000) {
    for (let i = 0; i < retries; i++) {
        console.log(`BGG Request Attempt ${i + 1} for URL: ${url}`);
        
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": "FrogCon/1.0" }
            });

            const text = await res.text();

            // Check for the "Accepted" queue message or 202 status
            if (res.status === 202 || text.includes("Your request for this collection has been accepted")) {
                console.log(`ATTEMPT ${i + 1}: BGG returned 202/Accepted. Waiting ${delay/1000}s...`);
                
                // Wait for the delay
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Go to next loop iteration
            }

            console.log(`ATTEMPT ${i + 1}: Success! Data received.`);
            return text;

        } catch (err) {
            console.error(`ATTEMPT ${i + 1}: Network Error:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    throw new Error("BGG took too long (timed out after all retries).");
}

exports.bggProxy = onRequest({
    timeoutSeconds: 120, // 2 minutes
    memory: "256MiB",
    region: "us-central1"
}, async (req, res) => {
    // Handle CORS
    return cors(req, res, async () => {
        try {
            const { type } = req.query;
            if (!type) return res.status(400).send("Missing type");

            let url;
            let cacheKey;

            switch (type) {
                case "collection":
                    const username = req.query.username;
                    if (!username) return res.status(400).send("Missing username");
                    url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&version=1`;
                    cacheKey = `collection_${username}`;
                    break;
                case "search":
                    const query = req.query.query;
                    if (!query) return res.status(400).send("Missing query");
                    url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
                    cacheKey = `search_${query}`;
                    break;
                case "thing":
                    const id = req.query.id;
                    if (!id) return res.status(400).send("Missing id");
                    url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&versions=1`;
                    cacheKey = `thing_${id}`;
                    break;
                default:
                    return res.status(400).send("Invalid type");
            }

            // 1. Check Firestore Cache First
            const cacheRef = db.collection("bggCache").doc(cacheKey);
            const cached = await cacheRef.get();
            if (cached.exists) {
                const { xml, timestamp } = cached.data();
                if (Date.now() - timestamp < 15 * 60 * 1000) {
                    console.log(`Serving ${cacheKey} from Firestore cache.`);
                    res.set("Content-Type", "text/xml");
                    return res.send(xml);
                }
            }

            // 2. Fetch from BGG (this is where the loop happens)
            const xml = await fetchWithRetry(url);

            // 3. Save to Cache
            await cacheRef.set({ xml, timestamp: Date.now() });

            res.set("Content-Type", "text/xml");
            return res.send(xml);

        } catch (err) {
            console.error("Final Function Error:", err);
            return res.status(500).send(err.message);
        }
    });
});