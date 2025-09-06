import dotenv from "dotenv";
import readLineSync from "readline-sync";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mock tool function for getting weather details
function getWeatherDetails(city) {
    const cityLowerCase = city.toLowerCase();
    switch (cityLowerCase) {
        case "pune":
            return "10°C";
        case "bhopal":
            return "12°C";
        case "patiala":
            return "10°C";
        case "mohali":
            return "14°C";
        default:
            return "15°C";
    }
}

// Map of available functions
const availableFunctions = {
    getWeatherDetails,
};

// Define the tool for Gemini, including its parameters
const toolDefinitions = [
    {
        functionDeclarations: [
            {
                name: "getWeatherDetails",
                description: "Get the weather details for a specific city.",
                parameters: {
                    type: "object",
                    properties: {
                        city: {
                            type: "string",
                            description: "The name of the city to get the weather for."
                        }
                    },
                    required: ["city"]
                }
            }
        ]
    }
];

// Initialize the model with the tool
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    tools: toolDefinitions,
});

async function chat() {
    // Start a new chat session
    const chatSession = model.startChat();

    console.log("Chat started. Type 'exit' to quit.");

    while (true) {
        const query = readLineSync.question(">> ");

        if (query.toLowerCase() === "exit") {
            console.log("Goodbye!");
            break;
        }

        try {
            // The initial message to the model must be a string.
            let userMessage = query;

            while (true) {
                // Send the message to Gemini
                const result = await chatSession.sendMessage(userMessage);

                // Get the response content
                const call = result.response.functionCall();
                const text = result.response.text();

                if (call) {
                    // Gemini has requested a tool function call
                    console.log(`\n**Tool Call Detected:** ${call.name}(${JSON.stringify(call.args)})`);
                    
                    const toolFunction = availableFunctions[call.name];
                    if (toolFunction) {
                        // Execute the function with the provided arguments
                        const toolResult = toolFunction(call.args.city);
                        console.log(`**Tool Result:** "${toolResult}"`);
                        
                        // Send the tool's output back to Gemini
                        userMessage = {
                            functionResponse: {
                                name: call.name,
                                response: {
                                    result: toolResult,
                                },
                            },
                        };
                    } else {
                        console.error(`Error: Function "${call.name}" not found.`);
                        break;
                    }
                } else if (text) {
                    // Gemini has provided a final text response
                    console.log(`\nAI Response: ${text}\n`);
                    break;
                } else {
                    console.log("AI did not return a valid response (text or tool call).");
                    break;
                }
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
}

// Start the chat
chat();
