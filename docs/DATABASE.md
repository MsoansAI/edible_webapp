# Database Schema Guide

This document outlines the structure of the Supabase PostgreSQL database, including key tables and the strategy behind the schema design.

## 1. Design Philosophy

The database schema employs a hybrid approach:

-   **Normalization:** Core transactional data (like orders, customers, products) is stored in a normalized structure to ensure data integrity, reduce redundancy, and facilitate accurate writes.
-   **Denormalization:** For performance-critical read operations, especially those required by the AI agent, specific data is denormalized into "flat" tables. This is achieved using PostgreSQL triggers and functions, which automatically create and update JSON blobs containing aggregated data. This approach avoids slow, complex joins at runtime.

## 2. Key Tables

### Core Transactional Tables

-   `products`: Stores base information for all available products (name, description, base price, images).
-   `product_options`: Contains variations for products (e.g., Small, Large, With Nuts). Each option can have its own price, overriding the base price. Linked to `products`.
-   `customers`: A central repository for all customer information. This table is linked 1-to-1 with the `auth.users` table for customers who create a web account.
-   `franchisees`: Details for each physical store, including address, operating hours, and store number.
-   `delivery_zones`: Defines the ZIP codes that each franchisee services, along with any associated delivery fees or minimum order amounts.
-   `inventory`: A join table that tracks the quantity of each `product` available at each `franchisee`.
-   `orders`: Header information for every order, including the customer, franchisee, status, totals, and fulfillment type.
-   `order_items`: The line items for each order. Linked to `orders`, `products`, and optionally `product_options`.
-   `addons`: A list of potential add-on products (e.g., a balloon, a greeting card).
-   `order_addons`: A join table linking selected `addons` to specific `order_items`.
-   `customer_addresses` / `recipient_addresses`: Stores shipping and delivery addresses associated with a customer.
-   `carts` / `cart_items`: Manages the state of a shopping cart before it is converted into a formal order.
-   `api_rate_limits`: Used by edge functions to track requests and prevent abuse.

### Denormalized "Flat" Tables for AI

These tables are read-only for the application and are updated automatically by database triggers whenever the underlying source data changes. They are designed for fast, simple lookups.

-   `chatbot_customers_flat`: Contains a denormalized JSONB column (`customer_data`) that holds a complete customer profile, including their order history.
-   `chatbot_franchisees_flat`: Holds a complete, denormalized snapshot of franchisee data, including hours and delivery zones.
-   `chatbot_orders_flat`: The most critical flat table. It contains a full JSONB representation (`order_data`) of an order, including all items, products, options, addons, customer details, and delivery information. This allows the AI to get the full context of an order with a single, fast query.

## 3. Triggers and Functions

The denormalization is powered by a set of PostgreSQL functions and triggers. For example:

-   A trigger on the `orders`, `order_items`, and `customers` tables will fire a function `update_chatbot_orders_flat()`.
-   This function gathers all the related information for the affected order, constructs a JSON object, and inserts or updates the corresponding row in `chatbot_orders_flat`.

This backend database architecture ensures both the data integrity required for a transactional e-commerce system and the high-performance read capabilities needed for a responsive AI agent. 