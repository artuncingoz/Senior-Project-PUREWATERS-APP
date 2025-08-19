const fs = require('fs');

// Read the JSON data from 'lakes_data.json'
fs.readFile('lakes_data.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err);
        return;
    }

    // Parse the JSON data
    const lakesData = JSON.parse(data);

    // Predefined user content messages (at least 5 different messages)
    const userMessages = [
        "What is the water quality of lake '${lakeName}'?",
        "Can you provide details about the water quality of lake '${lakeName}'?",
        "Please share the water quality parameters for lake '${lakeName}'.",
        "What are the recent reports about the water quality of lake '${lakeName}'?",
        "Could you summarize the water quality and conditions of lake '${lakeName}'?"
    ];

    // Open a writable stream for 'output.jsonl'
    const writeStream = fs.createWriteStream('output.jsonl', { flags: 'a', encoding: 'utf8' });

    // Process each lake's data and write it to the file
    lakesData.forEach((lakeData, index) => {
        const lakeName = lakeData["Lake Name"];

        // Get the user message by cycling through the userMessages array (use modulo operator to cycle)
        const userMessage = userMessages[index % userMessages.length].replace('${lakeName}', lakeName);
        
        // Prepare the assistant message with only the available parameters
        let assistantMessage = [];
        for (const [key, value] of Object.entries(lakeData)) {
            if (key !== "Lake Name" && value !== null && value !== undefined) {
                assistantMessage.push(`${key}: ${value}`);
            }
        }
        
        // If no data is available for the assistant message, set a default response
        const assistantMessageStr = assistantMessage.length ? assistantMessage.join(', ') : "Data not available right now";

        // Prepare the final JSON object in the desired format
        const jsonlEntry = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are an assistant that provides the user with information about water pollution and water quality in water resources in Turkey, such as lakes, rivers and streams."
                },
                {
                    "role": "user",
                    "content": userMessage
                },
                {
                    "role": "assistant",
                    "content": `Those are the general informations and parameters of the lake ${lakeName} in water quality topic: ` + assistantMessageStr
                }
            ]
        };

        // Write the JSONL entry to the file
        writeStream.write(JSON.stringify(jsonlEntry) + "\n");
    });

    // Close the writable stream after processing all the data
    writeStream.end(() => {
        console.log("Conversion complete. Output saved to 'output.jsonl'.");
    });
});
