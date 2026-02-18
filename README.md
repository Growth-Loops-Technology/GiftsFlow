<div align="center">
<p align="center">
  <img src="./images/Image1.png" width="250" alt="GiftsFlow Logo" />
</p>

# GiftsFlow

**Open-Source Conversational Gifting Platform**

_Chat. Gift. Automate. Celebrate._

<p align="center">
  <a href="#getting-started"><img src="https://img.shields.io/badge/Getting%20Started-Guide-blue?style=flat-square" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" /></a>
  <a href="https://github.com/Growth-Loops-Technology/GiftsFlow/stargazers"><img src="https://img.shields.io/github/stars/Growth-Loops-Technology/GiftsFlow?style=flat-square" />
</a>
</p>

---

**GiftsFlow** is an all-in-one, open-source platform for **conversational gifting**.  
Build delightful gifting experiences powered by chat, AI, and automation.  
*Start simple. Scale into a full gifting ecosystem.*

---
</div>

## 🚀 Why GiftsFlow?

✨ **Personalized gift recommendations** — delight every recipient  
💬 **Chat-based gifting assistants** — Web, WhatsApp, API-first  
🛍️ **Gift discovery & selection flows** — frictionless and intuitive  
🎉 **Occasion-based gifting** — birthdays, anniversaries, festivals  
🏢 **Corporate & bulk gifting** — campaigns, automation, analytics  
📊 **Actionable insights** — engagement, conversion, and performance  

---

## 🧠 Philosophy

Gifting is emotional. Systems are complex.  
**GiftsFlow** makes it simple:

**Intent → Conversation → Recommendation → Action**

---

## 🏗️ Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Frontend** | Next.js |
| **Backend** | API-first (Next.js / Serverless) |
| **AI** | OpenAI (LLM-powered chat & recommendations) |
| **Vector DB**| **Upstash** (Serverless semantic search & memory) |
| **Database** | MongoDB / PostgreSQL (configurable) |
| **Deployment** | Vercel |
| **SDK** | Vercel AI SDK |

<sub>Infrastructure choices are optimized for serverless performance and low latency.</sub>

---

## 📦 Key Modules (Planned)

- **Chat Engine** — conversational flows & intent detection  
- **Gift Catalog** — products, bundles, metadata  
- **Recommendation Engine** — AI + rules-based logic  
- **Workflow Builder** — occasions & campaign automation  
- **User Context Store** — preferences, history, memory (powered by Upstash)  
- **Analytics** — engagement & conversion insights  

---

## 🛠️ Getting Started

```bash
git clone https://github.com/Growth-Loops-Technology/GiftsFlow.git
cd giftsflow
npm install
# Configure UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in .env
npm run dev