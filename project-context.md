# Project Memory Bank

## Project Overview
This is a Next.js 16 application with Supabase authentication and Razorpay payment integration. The project is a template marketplace where users can purchase HTML templates.

## Tech Stack
- **Framework**: Next.js 16.0.0
- **React**: 19.2.0
- **Database/Auth**: Supabase (@supabase/ssr, @supabase/supabase-js)
- **Payment**: Razorpay
- **UI**: Radix UI components, Tailwind CSS, shadcn/ui
- **Language**: TypeScript

## Project Structure
```
/app
  /actions - Server actions (razorpay.ts)
  /admin - Admin dashboard pages
  /admin-setup - Admin setup page
  /api - API routes (checkout, templates, verify-payment, webhooks)
  /auth - Authentication pages (login, signup, callback)
  /dashboard - User dashboard and order management
  /template - Template viewing and checkout pages

/components
  /admin - Admin-specific components
  /ui - shadcn/ui components

/lib
  /supabase - Supabase client utilities
    - client.ts - Browser client
    - server.ts - Server component client
    - middleware.ts - Middleware session handler

/middleware.ts - Main middleware file (DEPRECATED - should be proxy.ts)
```

## Key Features
1. **Authentication**: Supabase Auth with email/password
2. **Authorization**: Role-based access (admin vs regular users)
3. **Payment Processing**: Razorpay integration for template purchases
4. **Template Management**: Admin can add/manage templates
5. **Order Management**: Users can view/download purchased templates
6. **Dynamic HTML Templates**: Placeholder-based templates with auto-generated forms
   - Admin creates HTML with `{{field_id}}` placeholders
   - System auto-extracts placeholders and generates field schemas
   - End users fill dynamic forms that render back into templates
7. **Live Preview on Template Detail Page**: Users can try templates before buying
   - Interactive fields with real-time preview updates
   - Collapsible customization panel
   - Sample data pre-filled for instant preview

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (required)
- `RAZORPAY_KEY_ID` - Razorpay API key ID (optional, for payments)
- `RAZORPAY_KEY_SECRET` - Razorpay API secret (optional, for payments)

**Note**: All Supabase client files validate these environment variables. Missing variables will:
- In middleware: Log error and continue (prevents app crash)
- In browser/server clients: Throw descriptive error messages

## Database Schema (from scripts/)
- `profiles` table - User profiles with `is_admin` flag
- `templates` table - Template metadata and HTML content
  - `version` column - Template version number (incremented on structural changes)
  - `html_content` column - HTML template with placeholders
- `template_fields` table - Field schema extracted from placeholders
  - `field_id` - Placeholder identifier (e.g., "student_name")
  - `label`, `type`, `required`, `options`, `default_value`, `order_index`, `help`
- `submissions` table - User-filled values for template instances
  - `data` (JSONB) - Field values: `{"field_id": "value"}`
  - `template_version` - Version at time of submission
- `orders` table - Purchase records
- `order_items` table - Items in each order
- `qr_codes` table - QR codes for order items (requires INSERT policy - see script 008)
- `downloads` table - Download tracking

## Important Notes
1. **Middleware Convention**: Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` for route handlers
2. **Supabase Setup**: Uses @supabase/ssr for server-side rendering support
3. **Protected Routes**: `/dashboard` and `/admin` routes require authentication
4. **Admin Routes**: `/admin` routes require `is_admin: true` in profiles table
5. **React Version**: Using React 19.2.0 - ensure compatibility with all dependencies

## Common Issues & Solutions
1. **Missing Environment Variables**: 
   - All Supabase client files now validate environment variables
   - Middleware gracefully handles missing env vars (logs error, continues)
   - Browser/server clients throw descriptive errors if env vars are missing
   - Create `.env.local` file with required variables (see Environment Variables section)
2. **Middleware Errors**: 
   - Middleware now has proper error handling with try-catch blocks
   - Environment variable validation prevents crashes
   - Auth errors are handled gracefully
3. **React Hooks Errors**: Usually caused by incorrect middleware setup or multiple React instances
   - Fixed by proper error handling in middleware
4. **Razorpay Receipt Length Error**: "receipt: the length must be no more than 40"
   - Fixed: Receipt now uses hash-based format (35 chars) instead of full UUIDs
   - Format: `ord_<24-char-hash>_<6-char-timestamp>`
5. **QR Codes RLS Policy Error**: "new row violates row-level security policy for table 'qr_codes'"
   - Fixed: Added INSERT policy for qr_codes table (scripts/008_add_qr_codes_insert_policy.sql)
   - Users can insert QR codes for order items belonging to their orders
   - Admins can also insert QR codes
   - **Action Required**: Run the SQL script in Supabase SQL editor
6. **Admin Dashboard Orders Not Showing**
   - Fixed: Updated query to properly join profiles through orders.user_id
   - Added error logging to debug RLS policy issues
   - **Possible Issue**: RLS policies might need to be verified (see scripts/009_verify_admin_orders_policy.sql)
   - **Action Required**: If orders still don't show, run script 009 to verify/refresh admin policies
7. **Template Update NOT NULL Constraint Errors**:
   - **Issue**: `PUT /api/templates` was sending undefined values for required fields like `price`
   - **Fix**: API now only updates fields that are explicitly provided in the request body
   - Template editor can now update `html_content` without sending all other fields
8. **Template Fields NOT NULL Constraint Error**: "null value in column 'field_id' violates not-null constraint"
   - **Issue**: `PUT /api/templates/[id]/fields` was missing `field_id` in upsert data
   - **Fix**: Added `field_id` to the update object (it's a NOT NULL column)
   - Fields can now be updated without constraint violations

## Authentication Flow
1. User signs up/logs in via `/auth/login` or `/auth/signup`
2. Supabase handles authentication
3. Callback page (`/auth/callback`) processes the auth response
4. Middleware (`updateSession`) checks authentication on protected routes
5. Admin routes additionally check `is_admin` flag in profiles table

## Payment Flow
1. User selects template and goes to checkout
2. `/api/checkout` creates Razorpay order
   - **Important**: Razorpay receipt ID must be <= 40 characters
   - Receipt format: `ord_<24-char-hash>_<6-char-timestamp>` (35 chars total)
   - Uses SHA256 hash of templateId + userId + timestamp for uniqueness
3. User completes payment on Razorpay
4. `/api/verify-payment` verifies signature and creates order record
   - Creates order, order_item, and qr_code records
   - **RLS Policy Required**: qr_codes table needs INSERT policy (see scripts/008_add_qr_codes_insert_policy.sql)
5. User can download template from `/dashboard/order/[id]/download`

## Razorpay Integration Notes
- **Receipt ID Constraint**: Must be 40 characters or less
- Receipt generation uses crypto hash to ensure uniqueness while staying within limit
- All order metadata (templateId, userId, templateName) stored in `notes` field

## Dynamic HTML Template System

### Overview
A complete system for creating HTML templates with dynamic placeholders that auto-generate forms for end users.

### Placeholder Syntax
- **Format**: `{{field_id}}` (e.g., `{{student_name}}`, `{{course_title}}`)
- **Rules**: 
  - Allowed characters: `[A-Za-z0-9_.-]`
  - Case-sensitive
  - Whitespace is normalized: `{{field_id}}` = `{{   field_id   }}`
  - Recommended: Use snake_case or kebab-case

### Admin Workflow
1. **Create/Edit Template** (`/admin/templates/[id]/edit`)
   - Paste HTML with placeholders in HTML Editor tab
   - Click "Sync Fields" to extract placeholders and create field schemas
   - Configure fields in Field Management tab (labels, types, validation, options)
   - Preview rendered output in Preview tab
   - Save template and fields

2. **Field Management**
   - Field types: `text`, `textarea`, `number`, `date`, `email`, `phone`, `select`, `checkbox`
   - Configure: label, type, required, options (for select/checkbox), default value, order, help text
   - System auto-generates default metadata from field_id (e.g., "email" → type: email)

3. **Versioning**
   - Template version increments automatically when fields are added/removed
   - Submissions store the version at time of creation

### End-User Workflow
1. **Access Form** (`/t/[id]`)
   - Public page (requires active template)
   - Dynamically generates form from `template_fields`
   - Validates inputs based on field metadata

2. **Fill & Submit with Live Preview**
   - Three view modes: Form Only, Split View (default), Preview Only
   - **Live Preview**: As users type, the preview updates in real-time
   - Split view shows form on left, live preview on right
   - Submit → saves to `submissions` table
   - Download rendered HTML at any time
   - Print functionality available

### API Routes
- `POST /api/templates/[id]/sync-fields` - Extract placeholders and sync field schemas
- `GET /api/templates/[id]/fields` - Fetch fields for a template
- `PUT /api/templates/[id]/fields` - Bulk update field metadata
- `POST /api/templates/[id]/render` - Render HTML with form data
- `POST /api/submissions` - Create submission
- `GET /api/submissions?template_id=...` - List submissions

### Utility Functions (`lib/template-utils.ts`)
- `extractFieldIds(html)` - Extract unique field IDs from HTML
- `renderHtml(templateHtml, data)` - Replace placeholders with values (XSS-safe)
- `escapeHtml(value)` - Escape HTML special characters
- `syncFields(existing, extracted)` - Diff and sync field schemas
- `getDefaultFieldDef(fieldId)` - Generate default field metadata

### Security
- **XSS Prevention**: All user values are HTML-escaped before injection
- **RLS Policies**: 
  - Admins and template owners can manage fields
  - Anyone can view fields for active templates (needed for form generation)
  - Users can view their own submissions
  - Admins can view all submissions
- **Validation**: Client and server-side validation based on field metadata
- **Template Isolation**: 
  - Fields are **completely separate** per template (each template has its own field set)
  - Database constraint: `UNIQUE(template_id, field_id)` ensures same field_id can exist in different templates
  - All queries filter by `template_id` to ensure isolation
  - API validates that fields being updated belong to the correct template

### Files Created
- `scripts/010_add_dynamic_template_system.sql` - Database schema
- `lib/template-utils.ts` - Utility functions
- `app/api/templates/[id]/sync-fields/route.ts` - Sync fields API
- `app/api/templates/[id]/fields/route.ts` - Fields management API
- `app/api/templates/[id]/render/route.ts` - Render API
- `app/api/submissions/route.ts` - Submissions API
- `app/admin/templates/[id]/edit/page.tsx` - Admin editor page
- `app/t/[id]/page.tsx` - Public form page (for filling and submitting)
- `app/template/[id]/page.tsx` - Template detail page (for preview before purchase)
- `components/admin/template-editor.tsx` - Template editor component
- `components/admin/field-manager.tsx` - Field management component
- `components/admin/template-preview.tsx` - Preview component
- `components/template-form.tsx` - Dynamic form component (with live preview)
- `components/template-detail-preview.tsx` - Template detail preview (for users to try before buying)

### Setup Required
1. Run `scripts/010_add_dynamic_template_system.sql` in Supabase SQL editor
2. Ensure `templates` table has `html_content` column (from script 007)
3. Templates must be marked as `active=true` to be accessible via `/t/[id]`

