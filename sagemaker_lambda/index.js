import { SageMakerRuntimeClient, InvokeEndpointWithResponseStreamCommand } from '@aws-sdk/client-sagemaker-runtime';

const sagemaker = new SageMakerRuntimeClient({ region: 'us-east-1' });

class TokenIterator {
    constructor(stream) {
        this.byteIterator = stream[Symbol.asyncIterator]();
        this.buffer = Buffer.alloc(0);
        this.readPos = 0;
    }

    async next() {
        while (true) {
            let lineEnd = this.buffer.indexOf('\n', this.readPos);
            if (lineEnd !== -1) {
                const line = this.buffer.slice(this.readPos, lineEnd);
                this.readPos = lineEnd + 1;
                const fullLine = line.toString('utf-8');
                try {
                    const lineData = JSON.parse(fullLine.replace(/^data:/, '').replace(/\n$/, ''));
                    if (lineData && lineData.token && typeof lineData.token.text === 'string') {
                        return { value: lineData.token.text, done: false };
                    }
                    // 유효한 토큰이 아닌 경우 건너뛰고 다음 라인으로 진행
                    console.log("Invalid token data, skipping:", fullLine);
                    continue;
                } catch (error) {
                    console.error("Error parsing JSON:", error, "Line:", fullLine);
                    continue;
                }
            }

            try {
                const { value: chunk, done } = await this.byteIterator.next();
                if (done) {
                    if (this.buffer.length > this.readPos) {
                        console.warn("Stream ended with incomplete data");
                    }
                    return { done: true };
                }
                this.buffer = Buffer.concat([this.buffer.slice(this.readPos), chunk.PayloadPart.Bytes]);
                this.readPos = 0;
            } catch (error) {
                console.error("Error reading stream:", error);
                return { done: true };
            }
        }
    }

    [Symbol.asyncIterator]() {
        return this;
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

    const payload = {
        inputs: PROMPT,
        parameters: { max_new_tokens: 256 },
        stream: true
    };

    const params = {
        EndpointName: "meta-textgeneration-llama-3-8b-2024-06-27-06-53-10-382",
        Body: JSON.stringify(payload),
        ContentType: "application/json",
    };

    try {
        console.log("Sending request to SageMaker with params:", JSON.stringify(params));
        const command = new InvokeEndpointWithResponseStreamCommand(params);
        const response = await sagemaker.send(command);

        const tokenIterator = new TokenIterator(response.Body);

        let hasWrittenContent = false;
        for await (const token of tokenIterator) {
            if (typeof token === 'string' && token.trim() !== '') {
                console.log("Token:", token);
                responseStream.write(token);
                hasWrittenContent = true;
            }
        }

        if (!hasWrittenContent) {
            console.log("No valid content was generated");
            responseStream.write("죄송합니다. 유효한 응답을 생성하지 못했습니다.");
        }
    } catch (error) {
        console.error("Error:", error);
        responseStream.write("An error occurred while processing your request: " + error.message);
    } finally {
        console.log("Ending response stream");
        responseStream.end();
    }
});
