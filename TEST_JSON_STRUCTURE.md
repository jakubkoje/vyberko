# Test JSON Structure Documentation

## Overview

This document describes the JSON structure used for test configuration in the digital selection test system. Tests are stored in the backend and fetched dynamically based on access codes.

## JSON Structure

### Root Level

```json
{
  "title": "Test Title",
  "description": "Test description",
  "showTimer": true,
  "maxTimeToFinish": 1800,
  "headerView": "advanced",
  "pages": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Title of the test displayed at the top |
| `description` | string | Yes | Description shown below the title |
| `showTimer` | boolean | No | Whether to show countdown timer (default: false) |
| `maxTimeToFinish` | number | No | Time limit in seconds (only if showTimer is true) |
| `headerView` | string | No | Header style: "basic" or "advanced" |
| `pages` | array | Yes | Array of page objects |

### Page Object

```json
{
  "name": "page1",
  "title": "Page Title",
  "description": "Page description",
  "elements": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the page |
| `title` | string | No | Page title |
| `description` | string | No | Page description |
| `elements` | array | Yes | Array of question/element objects |

### Element Types

#### 1. Radio Group (Single Choice)

```json
{
  "type": "radiogroup",
  "name": "question1",
  "title": "Question text?",
  "description": "Additional instructions",
  "correctAnswer": "Item 1",
  "isRequired": true,
  "choices": [
    { "value": "Item 1", "text": "Option 1" },
    { "value": "Item 2", "text": "Option 2" }
  ]
}
```

**Rendering**: `URadioGroup` from NuxtUI

#### 2. Checkbox (Multiple Choice)

```json
{
  "type": "checkbox",
  "name": "question2",
  "title": "Select all correct answers",
  "correctAnswer": ["Item 1", "Item 2", "Item 3"],
  "isRequired": true,
  "choices": [
    { "value": "Item 1", "text": "Option 1" },
    { "value": "Item 2", "text": "Option 2" },
    { "value": "Item 3", "text": "Option 3" }
  ]
}
```

**Rendering**: Multiple `UCheckbox` components
**Note**: correctAnswer is an array for checkbox questions

#### 3. Text Input

```json
{
  "type": "text",
  "name": "question3",
  "title": "Enter your answer",
  "placeholder": "Type here...",
  "isRequired": true,
  "inputType": "text"
}
```

**Rendering**: `UInput` from NuxtUI
**Note**: No correctAnswer validation for text inputs

#### 4. Email Input

```json
{
  "type": "text",
  "name": "email",
  "title": "Email address",
  "inputType": "email",
  "isRequired": true,
  "validators": [
    {
      "type": "email",
      "text": "Enter valid email"
    }
  ]
}
```

**Rendering**: `UInput` with type="email"

#### 5. Textarea / Comment

```json
{
  "type": "comment",
  "name": "essay",
  "title": "Write your answer",
  "placeholder": "Start typing...",
  "rows": 6,
  "maxLength": 1000,
  "isRequired": true
}
```

**Rendering**: `UTextarea` from NuxtUI

#### 6. Dropdown / Select

```json
{
  "type": "dropdown",
  "name": "selection",
  "title": "Select an option",
  "isRequired": true,
  "choices": [
    "Option 1",
    "Option 2",
    "Option 3"
  ]
}
```

**Rendering**: `USelect` from NuxtUI
**Note**: Choices can be strings or objects with value/text

#### 7. Boolean / Toggle

```json
{
  "type": "boolean",
  "name": "agree",
  "title": "Do you agree?",
  "isRequired": true
}
```

**Rendering**: `UToggle` from NuxtUI

#### 8. Rating

```json
{
  "type": "rating",
  "name": "satisfaction",
  "title": "Rate your satisfaction",
  "rateMax": 5,
  "isRequired": true
}
```

**Rendering**: Button group with `UButton` components

#### 9. HTML Content

```json
{
  "type": "html",
  "name": "instructions",
  "html": "<h3>Instructions</h3><p>Read carefully...</p>"
}
```

**Rendering**: Raw HTML rendering
**Note**: No user input, just display content

## Common Element Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Element type (radiogroup, checkbox, text, etc.) |
| `name` | string | Yes | Unique identifier for the element |
| `title` | string | Yes | Question or label text |
| `description` | string | No | Additional help text |
| `isRequired` | boolean | No | Whether answer is required (default: false) |
| `correctAnswer` | string/array | No | Correct answer(s) for grading |
| `placeholder` | string | No | Placeholder text for inputs |
| `choices` | array | No | Options for select/radio/checkbox |

## Scoring System

### Automatic Grading

The system automatically grades questions that have `correctAnswer` defined:

1. **Radio Group**: Direct comparison with correctAnswer
2. **Checkbox**: Array comparison (order independent)
3. **Other Types**: No automatic grading

### Score Calculation

```javascript
{
  "score": 8,           // Number of correct answers
  "total": 10,          // Total questions with correctAnswer
  "percentage": 80.00,  // Score as percentage
  "details": [          // Detailed results per question
    {
      "name": "question1",
      "title": "Question text",
      "type": "radiogroup",
      "userAnswer": "Item 1",
      "correctAnswer": "Item 1",
      "isCorrect": true
    }
  ]
}
```

### Passing Criteria

Default: 60% or higher is considered passing.
This can be configured in the backend.

## Example: Complete Test

```json
{
  "title": "Odborny test",
  "description": "Test na overenie odbornych znalosti",
  "showTimer": true,
  "maxTimeToFinish": 1800,
  "pages": [
    {
      "name": "instructions",
      "title": "Inštrukcie",
      "elements": [
        {
          "type": "html",
          "name": "intro",
          "html": "<h3>Vitajte v teste</h3><p>Tento test obsahuje 10 otázok...</p>"
        }
      ]
    },
    {
      "name": "questions",
      "title": "Otázky",
      "elements": [
        {
          "type": "radiogroup",
          "name": "q1",
          "title": "Aká je hlavné mesto Slovenska?",
          "correctAnswer": "bratislava",
          "isRequired": true,
          "choices": [
            { "value": "bratislava", "text": "Bratislava" },
            { "value": "kosice", "text": "Košice" },
            { "value": "zilina", "text": "Žilina" }
          ]
        },
        {
          "type": "checkbox",
          "name": "q2",
          "title": "Ktoré z nasledujúcich sú slovenské mestá?",
          "correctAnswer": ["bratislava", "kosice", "presov"],
          "isRequired": true,
          "choices": [
            { "value": "bratislava", "text": "Bratislava" },
            { "value": "kosice", "text": "Košice" },
            { "value": "brno", "text": "Brno" },
            { "value": "presov", "text": "Prešov" },
            { "value": "ostrava", "text": "Ostrava" }
          ]
        }
      ]
    }
  ]
}
```

## Backend Integration

### Fetching Configuration

**Endpoint**: `GET /api/test/configuration?code=ACCESS_CODE`

**Response**:
```json
{
  "title": "Test Title",
  "description": "...",
  "pages": [...]
}
```

### Submitting Results

**Endpoint**: `POST /api/test/submit`

**Request Body**:
```json
{
  "code": "ACCESS_CODE",
  "results": {
    "question1": "Item 1",
    "question2": ["Item 1", "Item 2"]
  },
  "score": {
    "score": 8,
    "total": 10,
    "percentage": 80,
    "details": [...]
  },
  "timeSpent": 1234
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test results successfully submitted",
  "score": {
    "score": 8,
    "total": 10,
    "percentage": 80
  }
}
```

## Validation Rules

### Client-Side Validation

1. **Required Fields**: Checked before page navigation
2. **Email Format**: Validated for inputType="email"
3. **Regex Patterns**: Custom validators supported
4. **Min/Max Length**: For text inputs

### Server-Side Validation

1. **Access Code**: Must be valid and unused
2. **Answer Format**: Must match expected type
3. **Time Limit**: Must submit within allowed time
4. **Required Questions**: All required questions answered

## Best Practices

### 1. Question Design

- Keep titles clear and concise
- Provide descriptions for complex questions
- Use appropriate question types
- Include HTML instructions when needed

### 2. Choice Format

- Use objects with value/text for clarity
- Keep values consistent (lowercase, no spaces)
- Make text user-friendly and clear

### 3. Grading

- Always include correctAnswer for graded questions
- Use consistent value formats
- For checkboxes, list all correct answers

### 4. User Experience

- Break long tests into multiple pages
- Add HTML elements for instructions
- Use appropriate time limits
- Provide clear error messages

## Testing

### Manual Testing

1. Create test JSON file
2. Place in `public/` directory or configure backend
3. Visit `/test?code=TEST123`
4. Complete test and verify scoring

### Example Test Files

- `test.example.json` - Basic example with radio and checkbox
- Located in project root and `/public` directory

## Migration from SurveyJS

If migrating from SurveyJS:

1. SurveyJS JSON is mostly compatible
2. Add `correctAnswer` fields for grading
3. Test with NuxtUI rendering
4. Adjust styling if needed

## Support

For questions about test structure:
- See `TEST_SYSTEM.md` for system overview
- See `QUICKSTART.md` for development guide
- Contact: podpora@vyberko.sk

