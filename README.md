# ContractSense

ContractSense is an AI-powered contract analysis platform built with a dual-backend architecture:

- `frontend`: React + Vite + TypeScript
- `backend`: Node.js + Express + TypeScript gateway for auth, persistence, and AI proxying
- `ai-service`: Python + FastAPI service for document parsing and AI/NLP workflows

## Work Tree

```text
.
├── .agents
│   └── rules
│       └── style-guide.md
├── .env.example
├── .gitignore
├── API_MOCK_DATA.json
├── PROJECT_STATE.md
├── README.md
├── ai-service
│   ├── Dockerfile
│   ├── app
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   ├── routers
│   │   │   ├── __init__.py
│   │   │   ├── analyze.py
│   │   │   ├── counter_clause.py
│   │   │   ├── flags.py
│   │   │   ├── outcome_sim.py
│   │   │   ├── party_intel.py
│   │   │   └── simplify.py
│   │   ├── services
│   │   │   ├── __init__.py
│   │   │   ├── clause_detector.py
│   │   │   ├── llm_service.py
│   │   │   ├── pdf_parser.py
│   │   │   ├── risk_scorer.py
│   │   │   └── scraper_service.py
│   │   └── utils
│   │       ├── __init__.py
│   │       ├── contract_type_classifier.py
│   │       └── text_chunker.py
│   └── requirements.txt
├── backend
│   ├── Dockerfile
│   ├── package.json
│   ├── src
│   │   ├── app.ts
│   │   ├── config
│   │   │   ├── db.ts
│   │   │   └── env.ts
│   │   ├── controllers
│   │   │   ├── ai.proxy.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── contract.controller.ts
│   │   │   ├── lawyer.controller.ts
│   │   │   └── report.controller.ts
│   │   ├── middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   ├── models
│   │   │   ├── Contract.model.ts
│   │   │   ├── Lawyer.model.ts
│   │   │   ├── Report.model.ts
│   │   │   ├── TrustSeal.model.ts
│   │   │   └── User.model.ts
│   │   ├── routes
│   │   │   ├── ai.proxy.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── contract.routes.ts
│   │   │   ├── lawyer.routes.ts
│   │   │   └── report.routes.ts
│   │   ├── server.ts
│   │   ├── services
│   │   │   ├── aiClient.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── payment.service.ts
│   │   └── utils
│   │       ├── fileParser.ts
│   │       ├── jwt.ts
│   │       └── pdfUpload.ts
│   └── tsconfig.json
├── docker-compose.yml
└── frontend
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── src
    │   ├── components
    │   │   ├── ClauseCard.tsx
    │   │   ├── ContractUploader.tsx
    │   │   ├── CounterClauseSuggestion.tsx
    │   │   ├── LawyerCard.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── OutcomeSimulatorChat.tsx
    │   │   ├── PartyIntelligencePanel.tsx
    │   │   ├── ReportExportButton.tsx
    │   │   ├── RiskFlag.tsx
    │   │   └── TrustSealBadge.tsx
    │   ├── context
    │   │   ├── AuthContext.tsx
    │   │   └── ContractContext.tsx
    │   ├── hooks
    │   │   ├── useAuth.ts
    │   │   ├── useContract.ts
    │   │   └── useReport.ts
    │   ├── main.tsx
    │   ├── pages
    │   │   ├── AuthPage.tsx
    │   │   ├── ContractAnalysisPage.tsx
    │   │   ├── LawyerDashboard.tsx
    │   │   ├── MarketplacePage.tsx
    │   │   ├── ReportPage.tsx
    │   │   └── UserDashboard.tsx
    │   ├── services
    │   │   └── api.ts
    │   ├── styles.css
    │   └── types
    │       └── index.ts
    ├── tsconfig.json
    └── vite.config.ts
```

## Inter-Service API Contract

Frontend calls Backend 1 only. Backend 1 proxies AI requests through [`ai.proxy.controller.ts`](/Users/prakharsharma/contractSenseRed/backend/src/controllers/ai.proxy.controller.ts).

### `POST /api/ai/analyze`
- Backend 1 controller: `analyzeContract`
- Request body:
```json
{
  "contractId": "string",
  "contractText": "string",
  "contractType": "msa",
  "parties": ["Alpha Corp", "Beta LLC"]
}
```
- Response body:
```json
{
  "contractType": "msa",
  "summary": "string",
  "clauses": [
    {
      "text": "string",
      "simplifiedText": "string",
      "riskFlag": "red",
      "explanation": "string",
      "counterClauseSuggestion": "string"
    }
  ],
  "overallRiskScore": 82,
  "recommendations": ["string"]
}
```

### `POST /api/ai/simplify`
- Backend 1 controller: `simplifyClause`
- Request body:
```json
{
  "clauseText": "string",
  "context": "string"
}
```
- Response body:
```json
{
  "simplifiedText": "string"
}
```

### `POST /api/ai/flags`
- Backend 1 controller: `getRiskFlags`
- Request body:
```json
{
  "clauses": ["string"]
}
```
- Response body:
```json
{
  "flags": [
    {
      "text": "string",
      "riskFlag": "yellow",
      "explanation": "string"
    }
  ]
}
```

### `POST /api/ai/counter-clause`
- Backend 1 controller: `generateCounterClause`
- Request body:
```json
{
  "clauseText": "string",
  "goal": "string"
}
```
- Response body:
```json
{
  "counterClauseSuggestion": "string",
  "negotiationNotes": ["string"]
}
```

### `POST /api/ai/party-intel`
- Backend 1 controller: `getPartyIntelligence`
- Request body:
```json
{
  "partyName": "string",
  "website": "string"
}
```
- Response body:
```json
{
  "partyName": "string",
  "summary": "string",
  "riskIndicators": ["string"],
  "sources": ["string"]
}
```

### `POST /api/ai/outcome-sim`
- Backend 1 controller: `simulateOutcome`
- Request body:
```json
{
  "contractId": "string",
  "messages": [
    {
      "role": "user",
      "content": "What happens if payment is 45 days late?"
    }
  ]
}
```
- Response body:
```json
{
  "reply": "string",
  "citations": ["Late fee clause"],
  "confidence": 0.78
}
```

## MongoDB Schema Outlines

- `User`: `name`, `email`, `passwordHash`, `userType`, `verificationStatus`, `ratings`, `pricing`
- `Contract`: `uploadedBy`, `fileUrl`, `contractType`, `status`, `clauseList`
- `Clause` embedded in `Contract`: `text`, `simplifiedText`, `riskFlag`, `explanation`, `counterClauseSuggestion`
- `Report`: `contractId`, `aiOutput`, `lawyerOutput`, `trustSeal`, `exportedPdfUrl`
- `Lawyer`: `userId`, `specializations`, `isVerified`, `ratings`, `feePerReview`
- `TrustSeal`: `reportId`, `lawyerId`, `issuedAt`, `sealHash`

## Docker Compose Design

[`docker-compose.yml`](/Users/prakharsharma/contractSenseRed/docker-compose.yml) defines:

- `frontend` on port `3000` with source-mounted Vite app
- `backend` on port `5000` with Mongo and AI service dependencies
- `ai-service` on port `8000` with Python service source mount
- `mongo` on port `27017` with persistent named volume `mongo-data`

## Getting Started

1. Copy `.env.example` to `.env`
2. Run `docker compose up --build`
3. Open [http://localhost:3000](http://localhost:3000)
