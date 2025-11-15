# How to Add Fields to HTML Templates

## Placeholder Syntax

Use double curly braces with a field ID inside: `{{field_id}}`

### ✅ Correct Examples

```html
<!-- Simple text fields -->
<div>
  <h1>{{title}}</h1>
  <p>{{description}}</p>
</div>

<!-- In attributes -->
<img src="{{image_url}}" alt="{{image_alt}}">

<!-- Multiple uses of same field -->
<div>
  <p>Hello {{name}}, welcome back {{name}}!</p>
</div>

<!-- With spaces (will be normalized) -->
<p>{{   student_name   }}</p>  <!-- Same as {{student_name}} -->

<!-- Using underscores, hyphens, dots -->
<p>{{student_name}}</p>
<p>{{student-name}}</p>
<p>{{student.name}}</p>
<p>{{student_name_2024}}</p>
```

### ❌ Incorrect Examples

```html
<!-- Wrong: Single curly braces -->
<p>{name}</p>  <!-- Won't work -->

<!-- Wrong: Spaces inside field_id -->
<p>{{student name}}</p>  <!-- Won't work - spaces not allowed -->

<!-- Wrong: Special characters -->
<p>{{name@email}}</p>  <!-- Won't work - @ not allowed -->
<p>{{name#1}}</p>  <!-- Won't work - # not allowed -->
```

## Complete Example Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .certificate { border: 2px solid #000; padding: 40px; text-align: center; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="certificate">
    <h1>Certificate of Achievement</h1>
    
    <p>This is to certify that</p>
    <h2><strong>{{student_name}}</strong></h2>
    
    <p>has successfully completed the course</p>
    <p><em>{{course_title}}</em></p>
    
    <p>on <span>{{completion_date}}</span></p>
    
    <p>with grade <strong>{{grade}}</strong></p>
    
    <p>Issued by: {{issuer_name}}</p>
    <p>Date: {{issue_date}}</p>
  </div>
</body>
</html>
```

**This template will extract these fields:**
- `student_name`
- `course_title`
- `completion_date`
- `grade`
- `issuer_name`
- `issue_date`

## Step-by-Step Guide

1. **Go to Admin Template Editor**
   - Navigate to `/admin/templates/[id]/edit`
   - Or click "Edit" button in the templates list

2. **Add HTML with Placeholders**
   - Go to "HTML Editor" tab
   - Paste your HTML with `{{field_id}}` placeholders
   - Example:
     ```html
     <div>
       <h1>{{title}}</h1>
       <p>{{description}}</p>
     </div>
     ```

3. **Save the Template**
   - Click "Save Template" button
   - This saves the HTML content to the database

4. **Sync Fields**
   - Click "Sync Fields" button
   - The system will:
     - Extract all `{{field_id}}` placeholders
     - Create field records for new placeholders
     - Remove fields that no longer exist in HTML
   - You should see: "Synced fields: X created, Y removed"

5. **Configure Fields**
   - Go to "Field Management" tab
   - Edit each field:
     - **Label**: Display name (e.g., "Student Name")
     - **Type**: text, textarea, number, date, email, phone, select, checkbox
     - **Required**: Check if field is mandatory
     - **Options**: For select/checkbox fields (one per line)
     - **Default Value**: Pre-filled value
     - **Order Index**: Display order (0, 1, 2, ...)
     - **Help Text**: Instructions for users
   - Click "Save Fields"

6. **Preview**
   - Go to "Preview" tab
   - See how the template looks with sample data
   - Adjust field values to test

## Field ID Naming Conventions

**Recommended:**
- Use **snake_case**: `student_name`, `course_title`
- Use **kebab-case**: `student-name`, `course-title`
- Use **dots for grouping**: `student.name`, `student.email`

**Avoid:**
- Spaces: `student name` ❌
- Special characters: `name@email`, `price#1` ❌
- Starting with numbers: `1name` ❌ (but `name1` ✅ is fine)

## Common Patterns

### Certificate Template
```html
<div class="certificate">
  <h1>Certificate of {{certificate_type}}</h1>
  <p>This certifies that <strong>{{recipient_name}}</strong></p>
  <p>has completed <em>{{course_name}}</em></p>
  <p>on {{completion_date}} with grade {{final_grade}}</p>
</div>
```

### Invoice Template
```html
<div class="invoice">
  <h1>Invoice #{{invoice_number}}</h1>
  <p>Date: {{invoice_date}}</p>
  <p>Bill To: {{customer_name}}</p>
  <p>Email: {{customer_email}}</p>
  <p>Amount: ${{total_amount}}</p>
</div>
```

### Form Letter Template
```html
<div class="letter">
  <p>Dear {{recipient_name}},</p>
  <p>{{letter_body}}</p>
  <p>Sincerely,</p>
  <p>{{sender_name}}</p>
  <p>{{sender_title}}</p>
</div>
```

## Troubleshooting

**Problem: Sync shows 0 fields created**

**Solutions:**
1. Check that placeholders use double curly braces: `{{field_id}}` not `{field_id}`
2. Ensure HTML content is saved (click "Save Template" first)
3. Check browser console for error messages
4. Verify placeholders don't have spaces inside: `{{field id}}` ❌ should be `{{field_id}}` ✅
5. Make sure you're using allowed characters: letters, numbers, dots, underscores, hyphens only

**Problem: Fields not appearing in form**

**Solutions:**
1. Make sure template is marked as `active = true`
2. Check that fields were saved (go to Field Management tab)
3. Verify field types are correct
4. Check RLS policies are set up (run script 010)

## Testing Your Template

1. After syncing fields, go to `/t/[template_id]`
2. You should see a form with all your fields
3. Fill out the form and click "Preview"
4. The rendered HTML should show your values in place of placeholders

