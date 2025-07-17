// This is your new backend file: /api/chat.js

export default async function handler(req, res) {
    // 1. We only accept POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Get the user's conversation history from the request body
    const { contents } = req.body;

    // 3. Get the secret API key from Vercel's environment variables
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
    }

    if (!contents) {
        return res.status(400).json({ error: "No contents provided in the request body." });
    }

    // 4. Define the Google Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        // 5. Securely call the Google API from the backend
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents }),
        });

        if (!googleResponse.ok) {
            const errorData = await googleResponse.json();
            console.error("Google API Error:", errorData);
            throw new Error(errorData.error?.message || 'Failed to get response from Google AI.');
        }

        const data = await googleResponse.json();
        
        // 6. Extract the text and send it back to the frontend
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiResponse) {
            res.status(200).json({ aiResponse });
        } else {
            res.status(500).json({ error: "Could not extract a valid response from the AI." });
        }

    } catch (error) {
        console.error('Error in serverless function:', error);
        res.status(500).json({ error: error.message });
    }
}
