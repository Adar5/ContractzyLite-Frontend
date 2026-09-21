# ContractzyLite 📝

ContractzyLite is a full-stack, AI-powered contract management platform designed to streamline the lifecycle of business agreements. It provides a secure environment to draft, digitally sign, analyze, and vault contracts using enterprise-grade cloud infrastructure and ultra-high-speed AI inference.

## 🚀 Key Features

* **AI-Powered Risk Analysis:** Select any clause within a contract and instantly generate legal risk assessments and remediated text using Groq's high-speed `gpt-oss-20b` inference engine.
* **Digital Signatures & Document Generation:** Type signatures that are dynamically stamped onto compliant PDFs generated on-the-fly using `pdf-lib`.
* **Enterprise Cloud Vaulting:** Automatically archives executed contracts into Oracle Cloud Infrastructure (OCI) Object Storage for secure, immutable record-keeping.
* **Dynamic Analytics Dashboard:** Real-time financial metrics, status tracking, and a live activity feed that calculates contract expirations and pending actions directly from the database.
* **Role-Based Workspaces:** Secure authentication flow seamlessly managing "Draft", "Sent", "Signed", and "Expired" states.

---

## 🏗 Architecture & Tech Stack

This project utilizes a modern, decoupled architecture separating the client interface from the API services. 

### Frontend (Client)
* **Framework:** Angular 
* **Styling:** Tailwind CSS
* **Architecture:** Component-driven design with reactive form handling and route guards.

### Backend (API)
* **Runtime:** Node.js with Express.js
* **Database:** MySQL (Persistent storage for users, contracts, and version control)
* **AI Engine:** Groq API (LLM Routing for sub-second text analysis)
* **Infrastructure:** Hosted on Oracle VM (Ubuntu)
* **Cloud Storage:** Oracle Cloud Infrastructure (OCI) Object Storage
* **Process Manager:** PM2

*(Note: The backend API repository is maintained separately. [https://github.com/Adar5/ContractzyLite-Backend.git])*

---

## 🛠 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* Angular CLI (`npm install -g @angular/cli`)
* MySQL Server
* Groq API Key
* Oracle Cloud Account (for OCI Vaulting)

### 1. Database Setup
Create a new MySQL database named `contractzy` and create `users`, `contracts`, and `contract_versions` tables.

### 2. Backend API Setup
Clone the backend repository and install dependencies:
```bash
git clone https://github.com/Adar5/ContractzyLite-Backend.git
cd ContractzyLite-Backend
npm install
```

Create a .env file in the backend root based on the provided .env.example:
```bash
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=contractzy

# Security & APIs
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=gsk_your_groq_api_key

# Oracle Cloud Infrastructure (OCI)
OCI_NAMESPACE=your_oci_namespace
OCI_BUCKET_NAME=your_oci_bucket
```

Start the local development server:
```bash
node server.js
```

### 3. Frontend Setup
Clone the frontend repository and install dependencies:
```bash
git clone https://github.com/Adar5/ContractzyLite-Frontend.git
cd ContractzyLite-Frontend
npm install
```
Start the Angular development server:
```bash
ng serve
```

Navigate to http://localhost:4200 to view the application.

## 💡 AI Micro-Targeting Workflow
ContractzyLite optimizes AI token usage and latency through a targeted selection workflow. Rather than processing 20-page documents in bulk, the Angular frontend intercepts user mouse selections (selectionStart/selectionEnd) and isolates specific clauses. This micro-payload is routed to Groq's LPUs, bypassing standard reasoning loops and returning formatted JSON remediations in milliseconds.

