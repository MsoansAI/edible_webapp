# Edible Arrangements - AI Assistant & Ordering Platform

This repository contains the frontend web application and backend serverless functions for the Edible Arrangements AI-powered assistant and e-commerce platform.

## Project Status

**Status:** `Active Development MVP`

This project is a functional, full-stack application built to demonstrate a modern, AI-driven ordering system. It includes a Next.js frontend, a complete set of Supabase edge functions for backend logic, and a sophisticated database schema.

**⭐ Recent Updates:**
- **Payment Link Generation**: NEW PUT endpoint for generating secure payment links for phone orders
- **Enhanced Phone Lookup**: Improved GET endpoint with customer phone number lookup
- **CORS Configuration**: Full HTTP method support (GET, POST, PATCH, PUT, OPTIONS)
- **API Documentation**: Updated with complete endpoint coverage and examples

## Core Features

-   **AI-Powered Chatbot:** An integrated chatbot (powered by Voiceflow & OpenAI) that can handle customer identification, semantic product search, order placement, and modifications.
-   **Full E-Commerce Flow:** Complete support for cart management, order creation, and user profile management.
-   **Dynamic Inventory & Store Location:** The system can find the nearest franchisee to a customer and check product availability in real-time.
-   **Authenticated User Sessions:** Supports user login and profile management for a personalized experience.

## Technical Architecture

The system is built on a modern, serverless architecture designed for scalability and performance.

-   **Frontend:** [Next.js](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/).
-   **Backend:** A suite of serverless [Edge Functions](https://supabase.com/docs/functions) on [Supabase](https://supabase.com/), written in TypeScript for Deno.
-   **Database:** [Supabase PostgreSQL](https://supabase.com/docs/database) with a hybrid normalized/denormalized schema for transactional integrity and AI performance.
-   **AI & Integrations:** [Voiceflow](https://www.voiceflow.com/) for conversational logic, [OpenAI](https://openai.com/) for NLP, and [VAPI](https://vapi.ai/) for telephony.

## 📚 Project Documentation

This project is supported by comprehensive documentation located in the `/docs` directory. For a new developer, we recommend reading the documents in the following order to get a full understanding of the system.

### Suggested Reading Path

1.  **[System Overview](./docs/SYSTEM_OVERVIEW.md)**: Start here for a high-level look at the project's goals, components, and user flows.
2.  **[Architecture Guide](./docs/ARCHITECTURE.md)**: A detailed guide to the frontend, backend, and integration architecture.
3.  **[Edge Functions Guide](./docs/EDGE_FUNCTIONS_GUIDE.md)**: The complete API reference for all backend serverless functions.
4.  **[Database Schema Guide](./docs/DATABASE.md)**: An explanation of the database structure, tables, and design philosophy.
5.  **[Voiceflow & AI Integration](./docs/AI_AGENT_INTEGRATION.md)**: Explains how the AI agent connects to the backend.

### Key Documents & Guides

-   **High-Level Overviews**
    -   `SYSTEM_OVERVIEW.md`: The "what" and "why" of the project.
    -   `ARCHITECTURE.md`: The "how" it all fits together.
-   **Backend & API**
    -   `EDGE_FUNCTIONS_GUIDE.md`: The definitive API reference for all backend functions.
    -   `DATABASE.md` & `DATABASE_STRUCTURE.md`: Deep dives into the PostgreSQL database.
-   **Voiceflow Integration**
    -   `AI_AGENT_INTEGRATION.md`: Shows how Voiceflow uses the backend APIs.
    -   `voiceflow-llm-master-prompt.md`: The core "brain" and logic for the AI agent.
    -   `voiceflow-tools-schema.json`: The machine-readable schema of the AI's tools.
    -   `voiceflow-api-examples.js`: Practical code examples for Voiceflow integration.
-   **Security**
    -   `SECURITY_GUIDE.md`: Details on Rate Limiting, RLS, and other security measures.

## 🚀 Getting Started

### Prerequisites

-   Node.js
-   npm or yarn
-   Supabase CLI

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd [repository-name]
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    -   Link your local repository to your Supabase project:
        ```bash
        supabase link --project-ref [your-project-ref]
        ```
    -   Pull any remote database changes:
        ```bash
        supabase db pull
        ```

4.  **Environment Variables:**
    -   Create a `.env.local` file in the root of the project.
    -   Add your Supabase URL and anon key:
        ```
        NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
        NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

### Edge Functions

The source code for all backend edge functions is located in the `supabase/functions/` directory.

-   To deploy all functions to your Supabase project, run:
    ```bash
    supabase functions deploy --project-ref [your-project-ref]
    ```
-   To deploy a single function:
    ```bash
    supabase functions deploy [function-name] --project-ref [your-project-ref]
    ```
