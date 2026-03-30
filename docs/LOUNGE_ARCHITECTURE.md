# The Lounge: Secure Professional Networking

This document outlines the architecture for "The Lounge," a secure, high-throughput, skill-gated environment for professional discourse.

## 1. Data Architecture (PostgreSQL & Neo4j)

### PostgreSQL (Relational Metadata)
The `lounges` table stores the core configuration and access rules.
```sql
CREATE TABLE lounges (
    lounge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    skill_thresholds JSONB NOT NULL, -- e.g., {"system_architecture": 85, "defi": 90}
    is_temporary BOOLEAN DEFAULT false, -- True for "burn-on-close"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Neo4j (Graph Relationships)
Neo4j handles the dynamic access control and membership tiers.

**Cypher Queries for Membership:**

*Create a Lounge and assign the Creator:*
```cypher
MATCH (u:User {id: $user_id})
CREATE (l:Lounge {id: $lounge_id, name: $name})
CREATE (u)-[:HAS_LOUNGE]->(l)
CREATE (u)-[:MEMBER_OF {access_tier: 'Creator', joined_at: datetime()}]->(l)
```

*Add a Guest after passing the Skill-Gate:*
```cypher
MATCH (u:User {id: $user_id}), (l:Lounge {id: $lounge_id})
CREATE (u)-[:MEMBER_OF {access_tier: $tier, joined_at: datetime()}]->(l)
```

*Check Membership Tier (for WebSocket Auth):*
```cypher
MATCH (u:User {id: $user_id})-[m:MEMBER_OF]->(l:Lounge {id: $lounge_id})
RETURN m.access_tier
```

---

## 2. Python/FastAPI Pydantic Models

These models define the data structures for the Lounge API endpoints.

```python
from pydantic import BaseModel, Field
from typing import Dict, Optional
from uuid import UUID
from datetime import datetime

class SkillThresholds(BaseModel):
    skills: Dict[str, int] = Field(..., description="Map of skill names to minimum required scores (0-100)")

class LoungeCreate(BaseModel):
    name: str = Field(..., max_length=255)
    skill_thresholds: SkillThresholds
    is_temporary: bool = Field(default=False, description="If true, all data is purged on close")

class LoungeResponse(LoungeCreate):
    lounge_id: UUID
    creator_id: UUID
    created_at: datetime

class JoinRequest(BaseModel):
    lounge_id: UUID

class JoinResponse(BaseModel):
    success: bool
    match_score: int
    access_tier: Optional[str] = None
    message: str

class ChatMessage(BaseModel):
    message_id: UUID
    lounge_id: UUID
    sender_id: UUID
    content: str
    expires_at: Optional[datetime] = None # For OTR sessions
```

---

## 3. The "Skill-Gate" Logic (Gemini API Integration)

When a user attempts to join a Lounge, the backend triggers an asynchronous evaluation:

1.  **Data Aggregation:** Fetch the applicant's recent "Raw Feed" posts, "Polished" portfolio items, and existing Neo4j tags.
2.  **Gemini Analysis:** Send this payload to the Gemini API with a prompt to evaluate the user's expertise against the Lounge's `skill_thresholds`.
3.  **Scoring:** Gemini returns a JSON object with a `match_score` (0-100) and a brief justification.
4.  **Decision:** If `match_score >= required_score`, the user is granted access and the `[:MEMBER_OF]` relationship is created in Neo4j.

---

## 4. High-Throughput Messaging & Security

### WebSocket Endpoint (`/lounge/{id}/stream`)
*   **Redis Pub/Sub:** Used as the message broker across the Kubernetes cluster. When a message is received on one pod, it's published to a Redis channel specific to that `lounge_id`.
*   **Redis Caching (List):** The last 100 messages are cached in a Redis List (`lounge:messages:{id}`) for instant retrieval when a user connects, ensuring sub-millisecond latency.

### Security Middleware (Authorized "Pros" Only)
Before upgrading the HTTP request to a WebSocket connection, the middleware must verify:
1.  **Authentication:** Validate the JWT token.
2.  **Authorization (Neo4j):** Query the graph database to ensure the `[:MEMBER_OF]` relationship exists for this `user_id` and `lounge_id`.
3.  **Rate Limiting:** Apply strict rate limits to prevent spam/DDoS.

```python
# Conceptual FastAPI Middleware
async def verify_lounge_access(websocket: WebSocket, lounge_id: UUID, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    # Fast Neo4j check
    access_tier = await graph_db.query("MATCH (u:User {id: $uid})-[m:MEMBER_OF]->(l:Lounge {id: $lid}) RETURN m.access_tier", uid=user.id, lid=lounge_id)
    
    if not access_tier:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise HTTPException(status_code=403, detail="Skill-Gate clearance required.")
    
    return user, access_tier
```

### "Off-the-Record" (OTR) & Self-Destruct
*   **Message Expiry:** For OTR sessions, messages are stored in Redis with a TTL (Time-To-Live) and in PostgreSQL with an `expires_at` timestamp. A background worker (e.g., Celery) continuously purges expired messages.
*   **Burn-on-Close:** If `is_temporary=True`, closing the Lounge triggers a cascading delete:
    1.  Drop the Redis cache and Pub/Sub channel.
    2.  Delete all `[:MEMBER_OF]` and `[:HAS_LOUNGE]` relationships in Neo4j.
    3.  `DELETE FROM messages WHERE lounge_id = X`
    4.  `DELETE FROM lounges WHERE lounge_id = X`
