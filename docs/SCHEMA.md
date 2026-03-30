# ProRaw Data Architecture

This document outlines the scalable data architecture for ProRaw, separating the core relational data (PostgreSQL) from the high-velocity relationship graph (Neo4j).

## 1. Relational Schema (PostgreSQL)

PostgreSQL is our source of truth for user accounts, core post content, and structured metadata. It handles the heavy lifting of data integrity and complex querying for the "Vault" (GIGs).

### `User` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `username` | VARCHAR(50) | Unique handle (e.g., @ceo_hustle) |
| `email` | VARCHAR(255) | User email |
| `professional_bio` | TEXT | LinkedIn-style bio |
| `is_verified` | BOOLEAN | Verification status |
| `exposure_dial` | INTEGER | 0-100 setting for content filtering |
| `created_at` | TIMESTAMP | Account creation date |

### `Post` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `author_id` | UUID (FK) | References `User.id` |
| `type` | ENUM | 'VIBE', 'GIG', 'SYSTEM' |
| `content` | TEXT | The raw text of the post |
| `title` | VARCHAR(255) | For GIGs (e.g., "Q3 Growth Report") |
| `category` | VARCHAR(100) | For GIGs (e.g., "RESEARCH PAPER") |
| `tag` | VARCHAR(100) | AI-generated or user tag (e.g., "ERR_SLIPPAGE") |
| `is_uncensored` | BOOLEAN | Flag for raw/unfiltered content |
| `intensity_score`| INTEGER | 0-100 AI-assigned score for the Exposure Dial |
| `created_at` | TIMESTAMP | Post creation date |

### `Attachment` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `post_id` | UUID (FK) | References `Post.id` |
| `url` | VARCHAR(512) | S3/IPFS link to the image/document |
| `type` | ENUM | 'IMAGE', 'PDF', 'VIDEO' |

---

## 2. Graph Schema (Neo4j)

Neo4j powers the "Re-vibe" tree, follower networks, and the "Nodes" metric. It allows us to instantly traverse deep relationships that would require expensive recursive JOINs in PostgreSQL.

### Nodes
*   `(:User { id: UUID, username: String })`
*   `(:Post { id: UUID, type: String })`
*   `(:Tag { name: String })`

### Edges (Relationships)
*   **(User)-[:FOLLOWS { timestamp: DateTime }]->(User)**
    *   *Use Case:* Generating the feed, finding 2nd-degree connections.
*   **(User)-[:CREATED { timestamp: DateTime }]->(Post)**
    *   *Use Case:* Fetching a user's timeline.
*   **(User)-[:REVIBED { timestamp: DateTime }]->(Post)**
    *   *Use Case:* The core viral mechanic. We can query `MATCH (p:Post)<-[:REVIBED*1..3]-(u:User)` to find the exact viral tree and calculate the "Nodes" metric.
*   **(User)-[:LIKED { timestamp: DateTime }]->(Post)**
    *   *Use Case:* Simple engagement tracking.
*   **(Post)-[:HAS_TAG]->(Tag)**
    *   *Use Case:* Finding trending topics and connecting users with similar interests.

## 3. Real-Time & Caching (Redis)

*   **Feed Caching:** `List` at key `feed:user_id` containing Post IDs.
*   **Atomic Counters:** `Hash` at key `post:stats:post_id` with fields `likes`, `revibes`, `comments`.
*   **Presence:** `String` at key `presence:user_id` with a 60-second TTL.
