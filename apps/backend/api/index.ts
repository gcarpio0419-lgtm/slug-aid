require("dotenv").config({ path: `../../.env` });
import { initializeApp } from "firebase/app";
import {
	addDoc,
	collection,
	doc,
	DocumentData,
	getDoc,
	getDocs,
	getFirestore,
	onSnapshot,
	setDoc,
	deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, listAll, ref } from "firebase/storage";
import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
const serviceAccountJson = Buffer.from(
	process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "",
	"base64",
).toString("utf-8");

if (serviceAccountJson) {
	const serviceAccount = JSON.parse(serviceAccountJson);
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
} else {
	console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set — auth middleware will reject all requests");
}

// Parse allowed emails from env
const allowedEmailsByLocation: Record<string, string[]> = {
	"redwood-free-market": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_REDWOOD ?? "[]");
		} catch {
			return [];
		}
	})(),
	"cowell-coffee-shop": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_COWELL ?? "[]");
		} catch {
			return [];
		}
	})(),
	"produce-pop-up": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_PRODUCE ?? "[]");
		} catch {
			return [];
		}
	})(),
	"womxns-center-food-pantry": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_WOMXNS ?? "[]");
		} catch {
			return [];
		}
	})(),
	"center-for-agroecology-farmstand": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_AGROECOLOGY ?? "[]");
		} catch {
			return [];
		}
	})(),
	"lionel-cantu-queer-center-food-pantry": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_QUEER ?? "[]");
		} catch {
			return [];
		}
	})(),
	"ethnic-resource-centers-snack-pantry": (() => {
		try {
			return JSON.parse(
				process.env.ALLOWED_EMAILS_ETHNIC_RESOURCE_CENTERS ?? "[]",
			);
		} catch {
			return [];
		}
	})(),
	"terry-freitas-cafe": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_TERRY_FREITAS ?? "[]");
		} catch {
			return [];
		}
	})(),
	"the-cove": (() => {
		try {
			return JSON.parse(process.env.ALLOWED_EMAILS_THE_COVE ?? "[]");
		} catch {
			return [];
		}
	})(),
};

const express = require("express");

const cors = require("cors");

const app = express();

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const locations = [
	"the-cove",
	"womxns-center-food-pantry",
	"redwood-free-market",
	"cowell-coffee-shop",
	"produce-pop-up",
	"terry-freitas-cafe",
	"center-for-agroecology-farmstand",
	"ethnic-resource-centers-snack-pantry",
	"lionel-cantu-queer-center-food-pantry",
];

const fireApp = initializeApp(firebaseConfig);
const storage = getStorage(fireApp);
const db = getFirestore(fireApp);

app.use(
	cors({
		origin: [process.env.NEXT_PUBLIC_WEBSITE_URL, "http://localhost:3000"],
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	}),
);

// Parse JSON request bodies
app.use(express.json());

// Auth middleware — verifies Firebase ID token and checks facility and email allowlist
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res.status(401).json({ error: "Missing or invalid Authorization header" });
		return;
	}

	const token = authHeader.split("Bearer ")[1];
	try {
		const decoded = await admin.auth().verifyIdToken(token);
		const email = decoded.email?.toLowerCase();
		const location = req.params.parameter || req.params.location;
		if (!location || !locations.includes(location)) {
			res.status(400).json({ error: "Invalid location: ${location}" });
			return;
		}

		const allowedEmails = allowedEmailsByLocation[location] ?? [];
		if (!email || !allowedEmails.includes(email)) {
			res.status(403).json({ error: "Forbidden access for facility"});
			return;
		}
		next();
	} catch (error) {
		console.error("Auth error:", error);
		res.status(401).json({ error: "Invalid or expired token" });
		return;
	}
}

// Location validation middleware — checks that the location param is valid
function validateLocation(req: Request, res: Response, next: NextFunction) {
	const location = req.params.parameter || req.params.location;
	if (!location || !locations.includes(location)) {
		res.status(400).json({ error: `Invalid location: ${location}` });
		return;
	}
	next();
}

let food: { [key: string]: { id: string; labels: string[] }[] } = {};
let images: { [key: string]: string[] } = {};
let status: { [key: string]: { message: string; timestamp: string } } = {};

//uploads food labels to firebase
async function uploadLabels(location: string, labels: string[]) {
	console.log(location);
	try {
		await addDoc(collection(db, location), { labels: labels });
		console.log("Document added successfully!");
	} catch (error) {
		console.error("Error adding document:", error);
	}
}

//fetches the image list (urls) of any given location from firebase
async function fetchImages(location: string) {
	const folderRef = ref(storage, location);
	const result = await listAll(folderRef);
	const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));

	// Wait for all download URLs to resolve
	const urls = await Promise.all(urlPromises);
	return urls;
}

//fetches the food list with ids for a given location from firebase
async function fetchFoodWithIds(location: string) {
	const foodArr: { id: string; labels: string[] }[] = [];
	const querySnapshot = await getDocs(collection(db, location));
	querySnapshot.forEach((doc) => {
		foodArr.push({ id: doc.id, labels: doc.data().labels });
	});
	return foodArr;
}

//fetches the status of any given location from firebase
async function fetchStatus(location: string) {
	let result = { message: "", timestamp: "" };
	const queryDoc = await getDoc(doc(db, "status", location));

	if (queryDoc.exists()) {
		result.message = queryDoc.data().status ?? "";
		result.timestamp = queryDoc.data().timestamp ?? "";
	}
	return result;
}

//Updates the status cache on updated values
const statusChanged = onSnapshot(collection(db, "status"), async () => {
	const promises = locations.map(async (locationName) => {
		status[locationName] = await fetchStatus(locationName); // await the promise here
	});

	// Wait for all promises to resolve
	await Promise.all(promises);
});

//Updates the food cache on updated values
locations.forEach((location) => {
	const locationSnapshot = onSnapshot(collection(db, location), async () => {
		food[location] = await fetchFoodWithIds(location);
	});
});

//gives a list of urls to the pictures for any given location
app.get("/images/:parameter", async (req: Request, res: Response) => {
	const location = req.params.parameter;

	if (location in images) {
		res.json({ urls: images[location] });
		return;
	}

	const data = await fetchImages(location);

	images[location] = data;
	res.json({ urls: data });
});

//gives a list of the food curently available at any given location
app.get("/food/:parameter", async (req: Request, res: Response) => {
	const location = req.params.parameter;
	if (location in food) {
		res.json({ food: food[location] });
		return;
	}

	const data = await fetchFoodWithIds(location);

	food[location] = data;
	res.json({ food: data });
});

//gives a list of the food with ids for a given location
app.get("/food-ids/:parameter", async (req: Request, res: Response) => {
	const location = req.params.parameter;
	const data = await fetchFoodWithIds(location);
	res.json({ food: data });
});

//gets the current status of any given location
app.get("/status/:parameter", async (req: Request, res: Response) => {
	const location = req.params.parameter;
	if (location in status) {
		res.json({ status: status[location] });
		return;
	}

	const data = await fetchStatus(location);

	status[location] = data;
	res.json({ status: data });
});

//gets a formatted list of all the available foods (used for the search bar)
app.get("/all-food", async (req: Request, res: Response) => {
	console.log(Object.keys(food).length === 0);

	if (Object.keys(food).length === 0) {
		// Fetch all locations in parallel and wait for them to complete
		await Promise.all(
			locations.map(async (location) => {
				food[location] = await fetchFoodWithIds(location);
			}),
		);
	}

	// Transform the food data into the expected response format
	const transformedFoodList = Object.entries(food).flatMap(([location, items]) =>
		items.filter(Boolean).map((item) => ({
			location,
			name: item,
		})),
	);

	res.json(transformedFoodList);
});

//scans the pictures for labels and uploads the results to firebase
app.post("/scan-items", authMiddleware, async (req: Request, res: Response) => {
	try {
		const visionKeyJson = Buffer.from(
			process.env.VISION_KEY_JSON ?? "",
			"base64",
		).toString("utf-8");
		const credentials = JSON.parse(visionKeyJson);

		const vision = require("@google-cloud/vision");
		const client = new vision.ImageAnnotatorClient({
			credentials,
		});

		const { url, location } = req.body;
		if (!url || !location || !locations.includes(location)) {
			res.status(400).json({ error: "Missing or invalid url/location" });
			return;
		}
		// Use await inside the async function
		const [result] = await client.objectLocalization(url);
		const labels = result.localizedObjectAnnotations;
		// Send the response with the detected labels
		uploadLabels(location, [
			...new Set(labels.map((item: any) => item.name)),
		] as string[]);

		//updates the cache to include the pictures
		images[location] = await fetchImages(location);

		res.json({ data: labels });
	} catch (error) {
		// Handle errors and send appropriate responses
		console.error(error);
		res
			.status(500)
			.json({ error: "An error occurred while processing your request." });
	}
});

//scans a PDF for item descriptions and uploads them to firebase
app.post("/scan-pdf", authMiddleware, async (req: Request, res: Response) => {
	try {
		const { url, location } = req.body;
		if (!url || !location) {
			res.status(400).json({ error: "Missing url or location" });
			return;
		}
		if (!locations.includes(location)) {
			res.status(400).json({ error: `Invalid location: ${location}` });
			return;
		}

		// Download the PDF file
		const axios = require("axios");
		const pdfBuffer = (await axios.get(url, { responseType: "arraybuffer" }))
			.data;
		console.log("PDF buffer size:", pdfBuffer.length);

		// Use pdf-parse to extract text content from the PDF
		const pdfParse = require("pdf-parse");
		const pdfData = await pdfParse(pdfBuffer);
		const text = pdfData.text;
		console.log("PDF text length:", text.length);

		// Split text into lines and clean them
		const lines = text
			.split("\n")
			.map((line: string) => line.trim())
			.filter((line: string) => line.length > 0);

		// Extract item descriptions using pattern matching
		const itemDescriptions = extractItemDescriptions(lines);

		console.log("Extracted item descriptions:", itemDescriptions);

		if (itemDescriptions.length === 0) {
			return res.status(200).json({ message: "No food items found in PDF." });
		}

		// Upload each item description
		for (const desc of itemDescriptions) {
			await uploadLabels(location, [desc]);
		}

		// Update the food cache
		food[location] = await fetchFoodWithIds(location);

		res.json({
			uploaded: itemDescriptions.length,
			items: itemDescriptions,
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ error: "An error occurred while processing the PDF." });
	}
});

function extractItemDescriptions(lines: string[]): string[] {
	const descriptions: string[] = [];

	// Look for lines that start with item numbers (6 digits) followed by description
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Pattern 1: Line starts with 6-digit item number (like "120019")
		const itemNumberMatch = line.match(/^(\d{6})\s+(.+)/);
		if (itemNumberMatch) {
			let description = itemNumberMatch[2];

			// Clean up the description by removing everything after quantity/unit info
			description = cleanDescription(description);

			if (description && description.length > 2) {
				descriptions.push(description);
			}
			continue;
		}

		// Pattern 2: Multi-line format where item number is on one line and description on next
		const standaloneItemNumber = line.match(/^\d{6}$/);
		if (standaloneItemNumber && i + 1 < lines.length) {
			let description = lines[i + 1];
			description = cleanDescription(description);

			if (description && description.length > 2) {
				descriptions.push(description);
			}
			continue;
		}
	}

	// If no structured format found, look for food-related keywords as fallback
	if (descriptions.length === 0) {
		return extractFoodItemsFallback(lines);
	}

	return descriptions;
}

function cleanDescription(rawDescription: string): string {
	let description = rawDescription;

	// First, remove any leading item numbers (6 digits)
	description = description.replace(/^\d{6}/, "").trim();

	// Remove common prefixes (without requiring space after)
	description = description
		.replace(/^(Veg|SC|Bevg|Bread|Raleys)/i, "") // Remove category prefixes
		.trim();

	// Stop at quantity indicators (numbers followed by units or slashes)
	const stopPatterns = [
		/\d+\/\d+/, // "12/16", "24/1"
		/\d+\s+(oz|lb|lbs|case|each)/i, // "16 oz", "1 lb"
		/\d+\s+\d+/, // "120 0"
		/\b(LB|CASE|EACH)\b/i, // Unit indicators
	];

	for (const pattern of stopPatterns) {
		const match = description.match(pattern);
		if (match) {
			description = description.substring(0, match.index).trim();
			break;
		}
	}

	// Remove trailing numbers and common suffixes
	description = description
		.replace(/\s+\d+$/, "") // Remove trailing numbers
		.replace(/\s+(dry|refrigerated|food)$/i, "") // Remove storage type
		.trim();

	// Normalize spacing and clean up
	description = description.replace(/\s+/g, " ").trim();

	// Handle specific cases where text got concatenated
	if (description.includes("Spagehtti")) {
		description = description.replace("Pasta Spagehtti", "Pasta Spaghetti");
	}

	return description;
}

function extractFoodItemsFallback(lines: string[]): string[] {
	const descriptions: string[] = [];

	// Food-related keywords for fallback detection
	const foodKeywords = [
		"kale",
		"cucumber",
		"peanut butter",
		"beans",
		"pasta",
		"spaghetti",
		"tomato",
		"sauce",
		"tuna",
		"onion",
		"potato",
		"turmeric",
		"lemonade",
		"bread",
		"chili",
		"rice",
		"green beans",
		"mushroom",
		"vegetable",
		"veg",
	];

	// Headers and non-food terms to exclude
	const excludeTerms = [
		"item",
		"description",
		"order",
		"qty",
		"accepted",
		"uom",
		"gross",
		"weight",
		"unit",
		"price",
		"packaging",
		"type",
		"pack",
		"size",
		"handling",
		"requirements",
		"shopping",
		"cart",
		"summary",
		"total",
		"due",
		"line",
		"items",
		"cube",
		"techbridge",
		"copyright",
		"terms",
		"condition",
		"privacy",
		"policy",
		"appointment",
		"reference",
		"number",
		"pickup",
		"delivery",
		"deliver",
		"date",
		"time",
		"comment",
		"agency",
		"express",
		"aws",
		"cloud",
		"https",
		"www",
		"agencyexpress",
	];

	for (const line of lines) {
		// Skip if line contains exclude terms
		if (
			excludeTerms.some((term) => line.toLowerCase().includes(term.toLowerCase()))
		) {
			continue;
		}

		// Skip if line is mostly numbers or currency
		if (/^\d+(\.\d{2})?$/.test(line) || /\$\d+\.\d{2}/.test(line)) {
			continue;
		}

		// Check if line contains food keywords
		if (
			foodKeywords.some((keyword) =>
				line.toLowerCase().includes(keyword.toLowerCase()),
			)
		) {
			const cleaned = cleanDescription(line);
			if (cleaned && cleaned.length > 2) {
				descriptions.push(cleaned);
			}
		}
	}

	return descriptions;
}

app.put("/update-status/:parameter", authMiddleware, validateLocation, async (req: Request, res: Response) => {
	try {
		const { message } = req.body;
		const location = req.params.parameter;
		const timestamp = new Date().toISOString();
		console.log(location);
		await setDoc(doc(db, "status", location), { status: message, timestamp });
		console.log("Document added/updated successfully!");
	} catch (error) {
		console.error("Error adding/updating document:", error);
	}
	res.status(200).json({ success: true });
});

app.put("/update-food/:parameter", authMiddleware, validateLocation, async (req: Request, res: Response) => {
	try {
		const { message } = req.body;
		console.log(message);
		const location = req.params.parameter;
		console.log(location);
		await addDoc(collection(db, location), { labels: message });
		console.log("Document added/updated successfully!");
		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error adding/updating document:", error);
		res.status(500).json({ error: "Failed to update food" });
	}
});

// DELETE a food document by id for a given location
app.delete("/food/:location/:id", authMiddleware, validateLocation, async (req: Request, res: Response) => {
	const { location, id } = req.params;
	try {
		await deleteDoc(doc(db, location, id));
		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Error deleting food document:", error);
		res.status(500).json({ error: "Failed to delete food documents" });
	}
});

// Ensures propper port usage
const PORT = process.env.EXPRESS_PORT || 3022;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

module.exports = app;
