require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini()
{
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
    {
        console.error("❌ GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    console.log(`Using API Key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("\nTesting gemini-2.0-flash-lite...");
    try
    {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent("Testing");
        const response = await result.response;
        console.log("✅ Success with gemini-2.0-flash-lite:", response.text().trim());
    } catch (error)
    {
        console.error(`❌ Failed with gemini-2.0-flash-lite: ${error.message}`);
    }

    console.log("\nListing available models via fetch...");
    try
    {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models)
        {
            console.log("\nAvailable Models:");
            data.models.forEach(m =>
            {
                if (m.supportedGenerationMethods.includes('generateContent'))
                {
                    console.log(`- ${m.name}`);
                }
            });
        } else
        {
            console.log("\nCould not list models:", JSON.stringify(data));
        }
    } catch (error)
    {
        console.error("\nFailed to list models via fetch:", error.message);
    }
}

testGemini();
