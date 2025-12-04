# Tiller Office Document Management System

A web-based office document management system for Tiller, enabling employees to create, manage, and export office forms digitally.

## Features

- **Authentication**: Email/password signup and login
- **User Profile**: Store employee details (name, ID, designation, mobile) for auto-fill
- **Document Forms**:
  - Leave Application Form
  - Money Requisition Form
  - Material Requisition Form
  - Advance Adjustment Form
- **Live Preview**: Real-time document preview as you fill forms
- **Print Support**: Print only the document (not the entire page)
- **Document History**: View, duplicate, and soft-delete saved documents
- **Fill for Another**: Option to fill forms on behalf of other employees
- **Mobile Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth user |
| full_name | TEXT | Employee's full name |
| employee_id | TEXT | Employee ID number |
| designation | TEXT | Job designation |
| mobile_number | TEXT | Contact number |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Document owner |
| document_type | TEXT | Form type (leave_application, money_requisition, etc.) |
| title | TEXT | Document title |
| form_data | JSONB | Form field data |
| status | TEXT | draft, submitted, approved |
| is_deleted | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Authentication Setup

The app uses Supabase Auth with email/password authentication. For development:

1. **Auto-confirm emails**: Email confirmation is enabled by default. For testing, you may want to disable "Confirm email" in auth settings.

2. **User Flow**:
   - New users sign up at `/auth`
   - After signup, they're redirected to the dashboard
   - Users should update their profile for form auto-fill

## Deployment

### Using Lovable

Simply open [Lovable](https://lovable.dev/projects/cb2deaba-90da-4b32-81d9-bed810f99989) and click on Share -> Publish.

### Custom Domain

Navigate to Project > Settings > Domains and click Connect Domain.

## Project Structure

```
src/
├── components/
│   ├── forms/           # Form components (Header, Footer, Field)
│   ├── layout/          # Layout components (Header, Footer, AppLayout)
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── integrations/        # Supabase client and types
├── lib/                 # Utility functions
├── pages/
│   ├── forms/           # Form pages (Leave, Money, Material, Advance)
│   ├── Auth.tsx         # Authentication page
│   ├── Dashboard.tsx    # Main dashboard
│   ├── History.tsx      # Document history
│   └── Profile.tsx      # User profile
└── App.tsx              # Main app with routing
```

## Key Features

### Print Functionality

The print feature uses CSS `@media print` rules to:
- Hide the form input section
- Display only the document preview
- Remove shadows and optimize for A4 paper

### Fill for Another

Each form has a checkbox to fill for another person. When enabled:
- Additional fields appear for the other person's details
- The preview shows the other person's information
- The logged-in user's details are still associated with the document

### Auto-fill from Profile

When users save their profile:
- Name, designation, employee ID, and mobile number are stored
- These fields are automatically populated when opening any form
- Users can still edit the values for each document

## Security

- **Row Level Security (RLS)**: Each user can only access their own data
- **Authentication Required**: All database operations require authentication
- **Soft Delete**: Documents are never permanently deleted, allowing recovery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - Tiller Holdings Limited
