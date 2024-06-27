import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

function parseJSON(message) {
    try {
        return JSON.parse(message);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        return null;
    }
}

export const handler = awslambda.streamifyResponse(async (event, responseStream, _context) => {
    let PROMPT;
    if (event.requestContext.http.method === 'POST') {
        const body = JSON.parse(event.body);
        PROMPT = body.prompt;
    } else {
        PROMPT = event.queryStringParameters?.prompt || "Explain to a preschooler what cloud computing is.";
    }

    const params = {
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2048,
            messages: [
                { role: "user", content: PROMPT }
            ],
            temperature: 0.5,
            top_k: 250,
            top_p: 0.5,
        }),
    };

    try {
        console.log("Sending request to Bedrock with params:", JSON.stringify(params));
        const command = new InvokeModelWithResponseStreamCommand(params);
        const response = await bedrock.send(command);

        let hasWrittenContent = false;
        for await (const chunk of response.body) {
            const parsed = parseJSON(Buffer.from(chunk.chunk.bytes).toString());
            console.log("Received chunk:", JSON.stringify(parsed));
            if (parsed && parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                console.log("Writing chunk:", parsed.delta.text);
                responseStream.write(parsed.delta.text);
                hasWrittenContent = true;
            }
        }

        if (!hasWrittenContent) {
            console.log("No content was written to the response stream");
            responseStream.write("죄송합니다. 응답을 생성하는 데 문제가 발생했습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        responseStream.write("An error occurred while processing your request: " + error.message);
    } finally {
        console.log("Ending response stream");
        responseStream.end();
    }
});
