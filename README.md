# Health.ai

## Next-Generation Explainable Clinical AI & Multi-Modal Diagnostic Telehealth System

Health.ai is an explainable, multi-modal clinical AI and telehealth platform designed to provide accessible, transparent, and structured clinical decision-support information.

The system combines structured symptom analysis, large-language-model reasoning, computer vision, prescription OCR, and medical-image analysis through a unified Progressive Web Application (PWA).

> **Important:** Health.ai is described in the research specification as a clinical decision-support / triage system. Its outputs are preliminary and require verification by a qualified healthcare professional. It is not a replacement for professional medical diagnosis or treatment.

---

## 🚀 Key Features

### 1. Explainable AI Symptom Differential Diagnosis

- Supports a dataset containing **2,000+ symptom/disease entries**.
- Users select symptoms and assign severity from **1–10**.
- Generates structured differential diagnoses.
- Provides probability and urgency information.
- Displays **symptom-level XAI contribution percentages**.
- Stores diagnostic history in Firebase Firestore.

### 2. Live Camera Visual Scanning

- Uses the browser camera through the MediaDevices API.
- Captures frames for visual analysis.
- Supports preliminary analysis of visible dermatological and physical symptoms.
- Can be used for:
  - Skin lesions
  - Rashes
  - Wounds
  - Visible physical abnormalities
- Static image upload is available as a fallback when camera access is unavailable.

### 3. Prescription OCR & Safety Analysis

The prescription-analysis workflow can:

- Extract medication names.
- Extract dosage and frequency information.
- Identify prescription instructions.
- Check potential drug-drug interactions.
- Highlight allergy-related warnings.
- Present common and serious side effects.
- Flag selected contraindication and special-population concerns.
- Produce structured safety recommendations.

### 4. Medical Radiology Image Analyzer

Supports preliminary analysis of:

- X-rays
- MRI images
- CT images

The module can identify visible anatomical structures, notable features, potential abnormalities, confidence information, and recommended follow-up.

Radiology results are explicitly treated as **preliminary** and require confirmation by a qualified radiologist.

---

## 🧠 Explainable AI

One of Health.ai's core concepts is **Structured Contribution XAI**.

Instead of presenting only a diagnostic probability, the system also provides a contribution breakdown showing how individual symptoms influenced the primary assessment.

Example:

```text
Primary Assessment
        │
        ├── Shortness of Breath → 55%
        ├── Fever              → 30%
        └── Dry Cough          → 15%
```

The contribution values are normalized so that the displayed symptom contributions sum to **100%** for the primary diagnosis.

This makes the AI output easier to interpret for patients and clinicians.

---

## 🏗️ System Architecture

```text
                         ┌───────────────────────┐
                         │      Health.ai PWA    │
                         │   React 19 + TS 5.8   │
                         └───────────┬───────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │       Express API Proxy         │
                    │ Validation • CORS • Rate Limit  │
                    └───────────────┬─────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Gemini 2.5 Flash   │
                         │ Text + Image AI     │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐       ┌──────▼──────┐       ┌─────▼───────┐
       │ XAI Symptom │       │ Image / OCR │       │ Radiology   │
       │ Differential │       │ Analysis    │       │ Analysis    │
       └─────────────┘       └─────────────┘       └─────────────┘

                         ┌──────────────────────┐
                         │ Firebase Auth        │
                         │ Firestore Database   │
                         └──────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Programming Language | TypeScript 5.8 |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite 6.2 |
| Backend | Express 4.21.2 |
| AI Engine | Google Gemini 2.5 Flash |
| AI SDK | `@google/genai` |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| PDF Generation | jsPDF + autoTable |
| Animation | Framer Motion |
| Icons | Lucide React |
| Testing | Vitest, React Testing Library, Supertest, Playwright |
| Application Type | Progressive Web Application (PWA) |

---

## 🔐 Security & Privacy

Health.ai uses a layered security architecture.

### Zero API-Key Exposure

The Gemini API key is stored on the server and accessed through environment variables.

The client does **not** directly expose the Gemini API key.

```text
Browser
   │
   │ Request
   ▼
Express Server
   │
   │ Server-side API key
   ▼
Gemini API
```

### Role-Based Access Control

The system defines operational access levels including:

- Super Admin
- Admin / Clinical Admin
- Moderator / Support
- Patient / User

### Firestore Security

Firestore rules restrict access to diagnostic records according to the authenticated user's identity and role.

### Additional Security Controls

- Server-side request validation
- JSON schema validation
- CORS configuration
- Rate limiting
- Input sanitization
- DOMPurify-based XSS protection
- TLS-protected transmission
- Audit logging

---

## 🗄️ Firestore Data Model

### `users`

Stores user profile information such as:

```text
uid
email
displayName
role
healthScore
createdAt
isVerified
```

### `diagnoses`

Stores diagnostic history including:

```text
userId
symptoms
primaryDiagnosis
confidencePercentage
riskLevel
xaiContributions
timestamp
```

Risk levels include:

```text
Low
Moderate
High
Critical
```

---

## 🔌 API Endpoints

### `POST /api/predict`

Used for symptom-based differential diagnosis.

Example request structure:

```json
{
  "symptoms": [
    "fever",
    "dry cough",
    "shortness of breath"
  ],
  "severities": {
    "fever": 8,
    "dry cough": 6,
    "shortness of breath": 9
  }
}
```

The response is structured around:

```text
differentials
xaiContributions
recommendedActions
```

### `POST /api/analyze-image`

Used for image-based workflows including:

- Live visual scanning
- Prescription analysis
- Radiology analysis

The server validates the image payload and applies a modality-specific analysis prompt.

---

## 🔄 Diagnostic Workflow

```text
START
  │
  ▼
User selects symptoms / uploads image
  │
  ▼
Input validation & normalization
  │
  ▼
Express API Proxy
  │
  ▼
Gemini 2.5 Flash
  │
  ▼
Structured JSON Response
  │
  ▼
Schema + Range Validation
  │
  ├────────────── Invalid ──────────────┐
  │                                    ▼
  │                         Local Rule-Based Engine
  │                                    │
  ▼                                    │
XAI Contribution Extraction ◄──────────┘
  │
  ▼
Risk / Result Visualization
  │
  ▼
Firestore Persistence
  │
  ▼
Clinical Review / User History
```

---

## 🧩 Graceful Degradation

Health.ai includes a local fallback mechanism based on the **2,000+ symptom-disease mappings**.

If the Gemini service becomes unavailable because of:

- API outage
- quota exhaustion
- model unavailability
- response validation failure

the system can fall back to the local rule-based symptom engine.

The interface can indicate:

```text
Analysis Mode: Local
```

---

## ⚡ Performance Engineering

The project uses several optimization strategies:

- Vite + Rollup production bundling
- Dynamic imports
- React lazy loading
- Code splitting
- Tree shaking
- Asset optimization
- WebP conversion where supported
- Tailwind CSS optimization
- Browser caching
- PWA offline persistence
- Client-side PDF generation

The research specification reports a **sub-1.2-second initial-load target** through bundle optimization and a **94/100 Lighthouse performance result**.

---

## 🧪 Testing & Validation

The research specification documents multiple testing layers.

### Unit Testing

```text
156 unit tests
```

### Integration Testing

```text
42 integration tests
```

### End-to-End Testing

```text
18 E2E tests
```

### Combined Coverage

```text
84%
```

The project also reports:

```text
TypeScript strict compilation → 0 errors
Production build → clean compilation
```

---

## 📊 Project Scale

The research specification documents:

| Metric | Value |
|---|---:|
| Source files | 38 |
| React / TypeScript components | 24 |
| Symptom/disease entries | 2,000+ |
| Unit tests | 156 |
| Integration tests | 42 |
| E2E tests | 18 |
| Combined test coverage | 84% |
| Lighthouse performance | 94/100 |

---

## 🎨 UI Design

The documented design system uses semantic colors for clinical risk communication:

| Risk | Color |
|---|---|
| Low | Emerald |
| Moderate | Amber |
| High / Critical | Rose |
| Interactive / XAI | Sky Blue |

The interface uses a dark clinical dashboard aesthetic with glassmorphism elements and responsive layouts.

---

## 📱 Progressive Web Application

Health.ai is designed as a PWA to provide:

- Responsive web access
- Installable application experience
- Offline persistence capabilities
- Mobile-friendly workflows
- Camera access for visual scanning
- Cloud synchronization when connectivity is available

---

## 📂 High-Level Project Structure

The research specification documents an architecture centered around components, server logic and data.

A representative structure is:

```text
Health.ai/
│
├── src/
│   ├── components/
│   ├── data/
│   │   └── symptomsData.ts
│   ├── modules/
│   ├── services/
│   ├── types/
│   └── ...
│
├── server.ts
├── package.json
├── tsconfig.json
├── vite.config.*
├── index.html
└── ...
```

> The exact file tree should be kept synchronized with the actual repository. The research paper documents 38 source files and 24 React/TypeScript components.

---

## ⚙️ Development & Build

The project uses Vite for development and production builds.

Install dependencies:

```bash
npm install
```

For production verification:

```bash
npm run build
```

The research specification reports that the production build completed cleanly with zero compilation errors and warnings.

> Check the repository's `package.json` for the exact development/start script configured for your current version.

---

## 🔑 Environment Configuration

The Gemini API key is intended to remain server-side.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do **not** expose the key in frontend source code or commit it to GitHub.

Recommended:

```text
.env
```

and ensure sensitive environment files are included in:

```text
.gitignore
```

---

## 🩺 Clinical Safety Notice

Health.ai is a **clinical decision-support and triage research/prototype system**.

AI-generated results:

- are not definitive diagnoses;
- should not replace qualified medical professionals;
- should not be used as a substitute for emergency care;
- require clinical verification where appropriate.

Radiology results are preliminary and should be confirmed by a qualified radiologist.

Prescription safety results should be verified with an appropriate physician or pharmacist.

If a medical emergency is suspected, seek immediate professional medical assistance.

---

## 🔮 Future Work

The research specification identifies several future directions:

- Federated learning
- FHIR / EHR integration
- Wearable health data
- Multilingual support
- Reinforcement learning / RLHF
- Edge AI
- Expanded clinical validation
- Additional modality integrations

---

## 📚 Research Reference

**Health.ai — Next-Generation Explainable Clinical AI & Multi-Modal Diagnostic Telehealth System**

- Document type: Enterprise Software Architecture & Research Specification
- Standard: IEEE / ACM Technical Report Standard
- Version: 2.5.0-PROD
- Date: August 4, 2026
- AI Engine: Google Gemini 2.5 Flash
- Frontend: React 19 / TypeScript 5.8
- Database: Firebase Firestore / Authentication

---

## 👥 Authors

**Health.ai Clinical Systems Engineering & Software Architecture Group**

---

## 📄 License

Add the project's actual license here before publishing the repository.

Example:

```text
MIT License
```

> Do not claim an MIT or other open-source license unless the repository actually includes that license.

---

## ⭐ Project Summary

Health.ai combines:

**Explainable AI + Multi-Modal Analysis + Telehealth + Clinical Decision Support + Security**

into a single web-based platform designed to make AI-assisted clinical information more transparent, accessible and structured.
