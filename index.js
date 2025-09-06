import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();
import readLineSync from "readline-sync"

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Tools
function getWeatherDetails(city) {
    // make api calls here
    if (city.toLowerCase() === "pune") "10°C"
    if (city.toLowerCase() === "bhopal") "12°C"
    else "15 ° C"
}


const SYSTEM_PROPMT = `
You are an ai assistant with START,PLAN and ACTION, Observation and Output state.
Wait for the user prompt and first PLAN using available tools.
After Planning, take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START prompt and observations

Strictly follow the JSON output format as in exmples

Available Tools:
- function getWeatherDetails(city:string):string
it is a function that accepts city name as string and returns weather details

Example:
START
{"type":"user","user":"What is the sum of weather of PAtiala and Mohali?"}
{"type":"plan","plan":"I will call the getWeatherDetails for Patiala"}
{"type":"action","function":"getWeatherDetails","input":"patiala"}
{"type":"observation","observation":"10°C"}
{"type":"plan","plan":"I will call getWeatherDetails for Mohali"}
{"type":"action","function":"getWeatherDetails","input":"mohali"}
{"type":"observation","observation":"14°C"}
{"type":"output","output":"The sum of weather of Patiala and Mohali is 24°C"}
`
const userMessage = "Hey, What is the weather of Bhopal?";

async function chat() {
    client.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
            { role: "user", content: userMessage },
            { role: "system", content: SYSTEM_PROPMT }
        ]
    }).then(e => {
        console.log(e.choices[0].message.content)
    })
}
chat();

const messages = [
    { "role": "system", "content": SYSTEM_PROPMT }
]

while (true) {
    const query = readLineSync.question(">> ");
    const q = {
        type: "user",
        user: query
    };
    messages.push({ "role": "user", "content": JSON.stringify(q) })

    while (true) {
        const chat = await client.chat.completions.create({
            model: "gpt-5-nano",
            messages: messages,
            response_format: { type: "json_object" }
        })
    }
}