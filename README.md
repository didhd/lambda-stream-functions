# Lambda Stream Functions

이 프로젝트는 AWS Lambda를 사용하여 Bedrock과 SageMaker 모델을 Streaming 형태로 호출하는 두 개의 Lambda 함수를 포함하고 있습니다. 또한 CloudFront와 연동하여 보안을 강화하는 방법도 포함되어 있습니다.

## 프로젝트 구조

```
lambda-stream-functions/
├── .gitignore
├── README.md
├── bedrock_lambda/
│   └── index.js
├── sagemaker_lambda/
│   └── index.js
└── client/
    ├── interactive.py
    └── requirements.txt
```

## 구성 요소

### Bedrock Lambda 함수

`bedrock_lambda/index.js` 파일에는 Bedrock 모델을 호출하는 Lambda 함수 코드가 포함되어 있습니다. 이 함수는 사용자의 프롬프트를 받아 Bedrock 모델에 전달하고, 생성된 응답을 스트리밍 방식으로 반환합니다.

- **의존성:** AWS SDK for JavaScript (`@aws-sdk/client-bedrock-runtime`)
- **지역 설정:** `us-east-1`
- **엔드포인트:** Lambda 함수 URL을 통해 접근 가능

### SageMaker Lambda 함수

`sagemaker_lambda/index.js` 파일에는 SageMaker 모델을 호출하는 Lambda 함수 코드가 포함되어 있습니다. 이 함수는 사용자의 프롬프트를 받아 SageMaker 모델에 전달하고, 생성된 응답을 스트리밍 방식으로 반환합니다.

- **의존성:** AWS SDK for JavaScript (`@aws-sdk/client-sagemaker-runtime`)
- **지역 설정:** `us-east-1`
- **엔드포인트:** Lambda 함수 URL을 통해 접근 가능

### 클라이언트 코드

`client/interactive.py` 파일은 Lambda 함수를 호출하는 클라이언트 코드입니다. 이 스크립트는 사용자로부터 프롬프트를 받아 Lambda 함수에 POST 요청을 보내고, 응답을 스트리밍 방식으로 처리합니다.

- **의존성:** Python `requests` 라이브러리
- **사용법:** `interactive.py` 파일을 실행하여 Lambda 함수에 프롬프트를 전송하고 응답을 받을 수 있습니다.

## 배포 및 설정

### AWS 설정

1. **Lambda 함수 생성:**
   - AWS Management Console을 사용하여 두 개의 Lambda 함수를 생성합니다.
   - 각 함수에 대해 필요한 IAM 역할 및 권한을 설정합니다 (예: Bedrock 호출 권한, SageMaker 호출 권한).

2. **Lambda 함수 URL 설정:**
   - Lambda 함수 URL을 생성하고 CloudFront와 연동하여 보안을 강화합니다.
   - CORS 설정을 통해 함수 URL에 접근할 수 있는 도메인을 제한합니다.

3. **CloudFront 설정:**
   - Lambda 함수 URL을 CloudFront 배포에 연결합니다.
   - CloudFront 원본 액세스 제어 (OAC)를 구성하여 Lambda 함수 URL에 대한 안전한 접근을 보장합니다.

### 환경 변수 설정

각 Lambda 함수는 특정 환경 변수를 필요로 할 수 있습니다. 이러한 변수는 AWS Management Console에서 Lambda 함수 설정 페이지의 "구성" 탭에서 설정할 수 있습니다.

### 로컬 개발

로컬에서 개발할 때는 각 Lambda 함수의 의존성을 설치해야 합니다. 각 디렉토리 (`bedrock_lambda`, `sagemaker_lambda`)에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다.

```bash
npm install
```

클라이언트 코드는 Python 의존성을 설치해야 합니다. `client` 디렉토리에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다.

```bash
pip install -r requirements.txt
```

## 사용 방법

### Lambda 함수 호출

Lambda 함수를 호출하려면 클라이언트 코드를 사용합니다. 예제 요청은 다음과 같습니다.

```
cd client
python interactive.py
```

### CloudFront를 통한 보안 강화

[Lambda 함수 URL을 CloudFront와 연동](https://aws.amazon.com/ko/blogs/tech/secure-your-lambda-function-urls-using-amazon-cloudfront-origin-access-control/)하여 보안을 강화할 수 있습니다. 다음과 같은 명령어를 통해 요청을 CloudFront로 전송합니다.

```bash
curl -N https://XXXnb4.cloudfront.net

payload='{"prompt":"야 안녕?"}'
payload_hash=$(echo -n $payload | openssl dgst -sha256 | awk '{print $2}')

curl -N -X POST \
  -H "Content-Type: application/json" \
  -H "x-amz-content-sha256: $payload_hash" \
  -d "$payload" \
  https://XXXnb4.cloudfront.net
```

> **참고:** Lambda 함수 URL과 함께 PUT 또는 POST 메서드를 사용하는 경우, 사용자가 요청을 CloudFront에 전송할 때 `x-amz-content-sha256` 헤더에 페이로드 해시 값을 포함해야 합니다. Lambda는 서명되지 않은 페이로드를 지원하지 않습니다.

## 결론

이 프로젝트는 AWS Lambda를 사용하여 Bedrock 및 SageMaker 모델을 호출하는 방법과 CloudFront를 통해 보안을 강화하는 방법을 설명합니다. 각 Lambda 함수는 AWS SDK를 사용하여 Bedrock 및 SageMaker 모델에 요청을 전송하고, 응답을 스트리밍 방식으로 처리합니다. 클라이언트 코드는 Python `requests` 라이브러리를 사용하여 Lambda 함수에 요청을 전송하고, 스트리밍 응답을 처리합니다.

추가적인 설정이나 도움이 필요하시면 언제든지 문의해 주세요.