# Library Management System

A full-stack library management system built with React (TypeScript) and Lovable Cloud (Supabase).

## Features

- 📚 **Book Management**: CRUD operations for books with availability tracking
- 👥 **Member Management**: Manage library members with contact details
- 📖 **Borrowing System**: Track book borrowings with due dates and late fees
- 📊 **Dashboard**: Analytics overview with stats and recent activity

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching and caching
- **React Hook Form + Zod** for form validation
- **Shadcn/UI** components

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** database
- **Edge Functions** for RESTful API endpoints
- **Row Level Security (RLS)** for data protection

## Project Structure

```
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── Layout.tsx   # Main layout wrapper
│   │   ├── BookForm.tsx
│   │   ├── MemberForm.tsx
│   │   └── BorrowingForm.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useBooks.ts
│   │   ├── useMembers.ts
│   │   └── useBorrowings.ts
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Books.tsx
│   │   ├── Members.tsx
│   │   └── Borrowings.tsx
│   ├── integrations/    # Supabase client and types
│   └── types/           # TypeScript type definitions
├── supabase/
│   ├── functions/       # Edge Functions (API endpoints)
│   │   ├── api-books/
│   │   ├── api-members/
│   │   └── api-borrowings/
│   └── migrations/      # Database migrations
└── public/
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd library-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Database Schema

### Books Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Book title |
| author | text | Author name |
| isbn | text | ISBN number |
| genre | text | Genre (optional) |
| quantity | integer | Total copies |
| available_quantity | integer | Available copies |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update |

### Members Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Member name |
| email | text | Email address |
| phone | text | Phone (optional) |
| membership_date | date | Join date |
| is_active | boolean | Active status |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last update |

### Borrowings Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| book_id | uuid | FK to books |
| member_id | uuid | FK to members |
| borrow_date | date | Borrow date |
| due_date | date | Due date |
| return_date | date | Return date (nullable) |
| status | text | 'borrowed' or 'returned' |
| late_fee | numeric | Late fee amount |

## API Endpoints

All API endpoints are implemented as Edge Functions.

### Books API (`/api-books`)
- `GET /api-books` - List all books
- `GET /api-books?id={id}` - Get single book
- `POST /api-books` - Create book
- `PUT /api-books?id={id}` - Update book
- `DELETE /api-books?id={id}` - Delete book

### Members API (`/api-members`)
- `GET /api-members` - List all members
- `GET /api-members?id={id}` - Get single member
- `POST /api-members` - Create member
- `PUT /api-members?id={id}` - Update member
- `DELETE /api-members?id={id}` - Delete member

### Borrowings API (`/api-borrowings`)
- `GET /api-borrowings` - List all borrowings
- `GET /api-borrowings?id={id}` - Get single borrowing
- `POST /api-borrowings` - Create borrowing (borrow book)
- `PUT /api-borrowings?id={id}&action=return` - Return book
- `DELETE /api-borrowings?id={id}` - Delete borrowing

## API Usage Examples

### Create a Book
```bash
curl -X POST https://tqbudqreueckqgksormk.supabase.co/functions/v1/api-books \
  -H "Content-Type: application/json" \
  -d '{"title": "1984", "author": "George Orwell", "isbn": "978-0451524935", "quantity": 5}'
```

### Borrow a Book
```bash
curl -X POST https://tqbudqreueckqgksormk.supabase.co/functions/v1/api-borrowings \
  -H "Content-Type: application/json" \
  -d '{"book_id": "uuid", "member_id": "uuid", "due_date": "2024-01-15"}'
```

### Return a Book
```bash
curl -X PUT "https://tqbudqreueckqgksormk.supabase.co/functions/v1/api-borrowings?id={id}&action=return"
```

## Running with Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t library-ms .
docker run -p 8080:8080 library-ms
```

## Seed Data

To seed the database with sample data, use the API endpoints:

```bash
# Create sample books
curl -X POST https://tqbudqreueckqgksormk.supabase.co/functions/v1/api-books \
  -H "Content-Type: application/json" \
  -d '{"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "isbn": "978-0743273565", "genre": "Fiction", "quantity": 3}'

# Create sample member
curl -X POST https://tqbudqreueckqgksormk.supabase.co/functions/v1/api-members \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "555-0123"}'
```

## Design Decisions & Assumptions

1. **No Authentication**: Currently the app is open access. Add Supabase Auth for production.
2. **Late Fee**: $1 per day late, calculated automatically on return.
3. **Book Availability**: Automatically decremented/incremented via database triggers.
4. **RLS Policies**: Set to allow all operations (adjust for production security).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

---

**URL**: https://lovable.dev/projects/769cc122-6c9e-471e-872b-004c069efe6a
