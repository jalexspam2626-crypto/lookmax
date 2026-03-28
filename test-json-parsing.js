function extractJSON(text)
{
    try
    {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1)
        {
            throw new Error("No JSON object found in response");
        }

        const jsonString = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
    } catch (e)
    {
        throw e;
    }
}

const testCases = [
    {
        name: "Pure JSON",
        input: '{"score": 85, "title": "Elite"}',
        expected: { score: 85, title: "Elite" }
    },
    {
        name: "Markdown Wrapped",
        input: '```json\n{"score": 85, "title": "Elite"}\n```',
        expected: { score: 85, title: "Elite" }
    },
    {
        name: "Conversational Prefix",
        input: 'The provided image is a close-up... Here is the analysis: {"score": 85, "title": "Elite"}',
        expected: { score: 85, title: "Elite" }
    },
    {
        name: "Conversational Suffix",
        input: '{"score": 85, "title": "Elite"}\nI hope this helps!',
        expected: { score: 85, title: "Elite" }
    },
    {
        name: "Embedded JSON",
        input: 'Analysis results follow: ```json {"score": 85, "title": "Elite"} ``` Let me know if you need more info.',
        expected: { score: 85, title: "Elite" }
    }
];

testCases.forEach(tc =>
{
    try
    {
        const result = extractJSON(tc.input);
        const success = JSON.stringify(result) === JSON.stringify(tc.expected);
        console.log(`${success ? '✅' : '❌'} Test: ${tc.name}`);
        if (!success)
        {
            console.log(`  Expected: ${JSON.stringify(tc.expected)}`);
            console.log(`  Got:      ${JSON.stringify(result)}`);
        }
    } catch (e)
    {
        console.log(`❌ Test: ${tc.name} failed with error: ${e.message}`);
    }
});
