import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local because dotenv might not be set up for this script
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && key.trim() === 'VITE_GEMINI_API_KEY') {
            apiKey = value.trim();
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!apiKey) {
    console.error("❌ No API key found in .env.local");
    process.exit(1);
}

console.log(`🔑 Testing API Key: ${apiKey.substring(0, 10)}...`);

const client = new GoogleGenAI({ apiKey });

async function test() {
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Hello, are you working?",
        });
        console.log("✅ API Response:", response.text);
    } catch (error) {
        console.error("❌ API Error:", error.message);
        if (error.message.includes("400")) console.log("👉 Suggestion: Check if model name is correct (gemini-2.0-flash experimental?)");
        if (error.message.includes("403")) console.log("👉 Suggestion: API Key might be invalid or quota exceeded.");
    }
}

test();
