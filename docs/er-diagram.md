# Flow - ER Diagram

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : belongs
    Workspace ||--o{ WorkspaceMember : contains
    User ||--o{ Board : creates
    Workspace ||--o{ Board : contains
    Board ||--o{ List : contains
    List ||--o{ Card : contains
    Board ||--o{ Card : aggregates
    User ||--o{ Card : assignees
    User ||--o{ Card : createdBy
    Workspace ||--o{ Channel : contains
    Channel ||--o{ Message : contains
    User ||--o{ Message : sends
    Message ||--o{ Message : replyTo
    Workspace ||--o{ Note : contains
    User ||--o{ Note : author
    User ||--o{ AuditLog : actions
    User ||--o{ Session : sessions
    Workspace ||--o{ AuditLog : resource

    User {
        ObjectId _id PK
        string email UK
        string password
        string name
        string avatar
        string role "owner|admin|member"
        ObjectId workspaces FK
        string chatCode UK
        boolean isActive
        datetime lastLoginAt
    }

    Workspace {
        ObjectId _id PK
        string name
        string slug UK
        ObjectId owner FK
        array members "user, role, joinedAt"
        object settings "isPublic, allowMemberInvite, defaultBoardVisibility"
        string avatar
    }

    WorkspaceMember {
        ObjectId user FK
        string role
        datetime joinedAt
    }

    Board {
        ObjectId _id PK
        ObjectId workspace FK
        string name
        string description
        string background
        string visibility "private|workspace"
        ObjectId[] members FK
        ObjectId[] lists FK
        ObjectId createdBy FK
    }

    List {
        ObjectId _id PK
        ObjectId board FK
        string name
        number position
        ObjectId[] cards FK
        boolean isArchived
    }

    Card {
        ObjectId _id PK
        ObjectId list FK
        ObjectId board FK
        string title
        string description
        number position
        ObjectId[] assignees FK
        string[] labels
        datetime dueDate
        datetime startDate
        boolean isArchived
        datetime completedAt
        ObjectId createdBy FK
        array attachments "name,url,type,size"
    }

    Channel {
        ObjectId _id PK
        ObjectId workspace FK
        string name
        string type "channel|dm"
        ObjectId[] members FK
        ObjectId createdBy FK
        boolean isArchived
        datetime lastMessageAt
    }

    Message {
        ObjectId _id PK
        ObjectId channel FK
        ObjectId user FK
        string content
        ObjectId replyTo FK
        array attachments
        datetime editedAt
        boolean isDeleted
    }

    Note {
        ObjectId _id PK
        ObjectId workspace FK
        ObjectId author FK
        string title
        string content
        boolean isPinned
        boolean isArchived
        string[] tags
    }

    Session {
        ObjectId _id PK
        ObjectId userId FK
        string refreshToken UK
        datetime expiresAt "TTL"
        boolean revoked
    }

    AuditLog {
        ObjectId _id PK
        ObjectId userId FK
        string action
        string resource
        ObjectId resourceId
        string ip
        string userAgent
        mixed metadata
    }
```

## Collections & Indexes

- **User** `user.model.js:45` text index `name`, unique `email`, `chatCode`
- **Workspace** `workspace.model.js:23` `owner:1`, `members.user:1`, unique `slug`
- **Board** `board.model.js:14` `workspace:1,createdAt:-1`, `members:1`
- **List** `list.model.js:11` `board:1,position:1`
- **Card** `card.model.js:24` `list:1,position:1`, `board:1,isArchived:1`, `assignees:1`, `dueDate:1`, text `title+description:28`
- **Channel** `channel.model.js:14` `workspace:1,type:1`, `members:1`
- **Message** `message.model.js:18` `channel:1,createdAt:-1`, `user:1`
- **Note** `note.model.js:13` `workspace:1,createdAt:-1`, text `title+content:14`
- **AuditLog** `audit.model.js:13` `userId:1,createdAt:-1`, `resource:1,resourceId:1`, indexes on `userId,action,resource`

## Relationships Notes

- Workspace `members` embeds role hierarchy `owner(3)>admin(2)>member(1)` used in `rbac.js:1` and `workspace.service.js:134 getMemberRole`
- Board `visibility` private limits to `members` + `createdBy` (`board.service.js:74`)
- List `position` spaced `*1000` allows reorder without reindex, transaction in `reorderLists:64`
- Card `board` denormalized for `$text` search without join; move uses transaction (`card.service.js:88`)
- Channel `members` `$all + $size:2` for DM uniqueness (`chat.service.js:61`)
- Message `replyTo` self-ref, audit `metadata` sanitizes `password` (`audit.js:31`)

## Aggregations Referenced

- `getBoardFull:87` `$match board + $lookup cards pipeline $lookup users`
- `getBoardStats:180` `$lookup cards $group total/overdue/assignedToMe $cond`

## Diagram Source

Generated from Mongoose schemas in `backend/src/modules/*/*.model.js`, indexes verified via `model.js` files.

## Visual Export

For PNG export: paste mermaid code into https://mermaid.live and export PNG to `docs/er-diagram.png`.
