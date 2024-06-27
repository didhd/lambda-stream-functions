import boto3
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import json
from urllib.parse import urlparse

# AWS 설정
region = "us-east-1"  # 사용 중인 리전으로 변경하세요
service = "lambda"

# boto3 세션 생성 (AWS 자격 증명이 올바르게 설정되어 있어야 합니다)
session = boto3.Session()
credentials = session.get_credentials()


def sign_request(url, method, body=None):
    parsed_url = urlparse(url)
    request = AWSRequest(method=method, url=url, data=body)
    SigV4Auth(credentials, service, region).add_auth(request)
    return dict(request.headers)


def call_lambda_function(prompt):
    url = "https://AABB.lambda-url.us-east-1.on.aws/"
    method = "POST"
    body = json.dumps({"prompt": prompt})
    headers = sign_request(url, method, body)
    headers["Content-Type"] = "application/json"

    print("AI's response:")
    response_content = ""
    with requests.post(url, headers=headers, data=body, stream=True) as r:
        if r.status_code != 200:
            print(f"Error: {r.status_code} - {r.text}")
            return
        for chunk in r.iter_content(chunk_size=None):
            if chunk:
                decoded_chunk = chunk.decode()
                print(decoded_chunk, end="", flush=True)
                response_content += decoded_chunk

    if not response_content.strip():
        print("No response received from the server.")
    print("\n")


def main():
    print("Welcome to the AI chat interface!")
    print("Type 'quit' to exit the program.")

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == "quit":
            print("Goodbye!")
            break

        call_lambda_function(user_input)


if __name__ == "__main__":
    main()
