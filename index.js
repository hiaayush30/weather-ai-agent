
// using gemini
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import readlineSync from "readline-sync"

dotenv.config();

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tools
function getWeatherDetails(city) {
    // make api calls here
    if (city.toLowerCase() === "pune") return "10°C"
    if (city.toLowerCase() === "bhopal") return "12°C"
    return "15 ° C"
}

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `
You are an ai assistant with START,PLAN and ACTION, OBSERVATION and OUTPUT state.
Wait for the user prompt and first PLAN using available tools.
After Planning, take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START prompt and observations

Strictly follow the JSON output format as in exmples

Available Tools:
- function getWeatherDetails(city:string):string
it is a function that accepts city name as string and returns weather details

You only have the above functions. for any other actions do it yourself or apologize to the user.

Example:
START
{"type":"user","user":"What is the sum of weather of Patiala and Mohali?"}
{"type":"plan","plan":"I will call the getWeatherDetails for Patiala"}
{"type":"action","function":"getWeatherDetails","input":"patiala"}
{"type":"observation","observation":"10°C"}
{"type":"plan","plan":"I will call getWeatherDetails for Mohali"}
{"type":"action","function":"getWeatherDetails","input":"mohali"}
{"type":"observation","observation":"14°C"}
{"type":"output","output":"The sum of weather of Patiala and Mohali is 24°C"}
`;

// Define the JSON schema for the model's output
// This ensures Gemini generates a response in the correct format.
// const responseSchema = {
//     type: "OBJECT",
//     properties: {
//         type: {
//             type: "STRING",
//             enum: ["plan", "action", "output"]
//         },
//         plan: { type: "STRING" },
//         function: { type: "STRING" },
//         input: { type: "STRING" },
//         output: { type: "STRING" }
//     }
// };

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
        responseMimeType: "application/json",
        // responseSchema: responseSchema
    }
});

const tools = {
    "getWeatherDetails": getWeatherDetails
};

// Use an array of objects to store the chat history for Gemini
const messages = [];

async function main() {
    console.log("Gemini AI Agent. Type 'exit' to quit.");

    while (true) {
        const query = readlineSync.question(">> ");
        if (query.toLowerCase() === "exit") {
            console.log("Exiting...");
            break;
        }

        // Add the user's message to the conversation history
        messages.push({
            role: "user",
            parts: [{ text: JSON.stringify({ type: "user", user: query }) }]
        });

        // The main agent loop
        while (true) {
            try {
                // Generate content using the conversation history
                const chatResult = await model.generateContent({
                    contents: messages
                });
                const rawResponse = chatResult.response.candidates[0].content.parts[0].text;
                console.log("\n\n--- Agent Response ---");
                console.log(rawResponse);
                console.log("----------------------\n\n");

                messages.push({ role: "model", parts: [{ text: rawResponse }] }); 
                // abv tells the Gemini API, "The following message came from me, the AI." 
                const call = JSON.parse(rawResponse);

                if (call.type === "output") {
                    console.log(`Final Response: ${call.output}`);
                    break; // Exit the inner loop and wait for new user input
                } else if (call.type === "action") {
                    const fn = tools[call.function];
                    const obs = fn(call.input);
                    // Add the observation back to the conversation as a user part
                    messages.push({
                        role: "user",
                        parts: [{ text: JSON.stringify({ type: "observation", observation: obs }) }]
                    });
                }
            } catch (error) {
                console.error("An error occurred:", error);
                break;
            }
        }
    }
}

main();
