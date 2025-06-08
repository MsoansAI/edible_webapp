# Edible Arrangements - AI Assistant & Ordering Platform

This repository contains the frontend web application and backend serverless functions for the Edible Arrangements AI-powered assistant and e-commerce platform.

## Project Status

**Status:** `Active Development`

This project is a functional, full-stack application built to demonstrate a modern, AI-driven ordering system. It includes a Next.js frontend, a complete set of Supabase edge functions for backend logic, and a sophisticated database schema.

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

For a complete breakdown of the project's components, data flow, and technical implementation, please see our detailed documentation:

-   **[System Overview](./docs/SYSTEM_OVERVIEW.md)**: A high-level look at the project's goals, components, and user flow.
-   **[Technical Architecture](./docs/ARCHITECTURE.md)**: A detailed guide to the frontend, backend, and integration architecture.
-   **[Database Schema Guide](./docs/DATABASE.md)**: An explanation of the database structure, tables, and design philosophy.

## Getting Started

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