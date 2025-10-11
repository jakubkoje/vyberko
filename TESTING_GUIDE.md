# Testing Guide - Complete System Walkthrough

## Quick Test

### 1. Start Server

```bash
pnpm dev
# Server runs on: http://localhost:3001
```

### 2. Test Auto-Save Feature

#### Step 1: Start Test

```
Visit: http://localhost:3001
Enter code: TEST123
Click: Spustiť test
```

**Expected:**
- Redirects to `/test?code=TEST123`
- Shows: "Digitálny výberový test"
- Timer appears in header: ⏰ 14:45
- No "Uložené" badge yet (no answers)

#### Step 2: Answer First Question

```
Question: "Ako sa mas?"
Select: "dobre" (radio button)
```

**Expected:**
- ✅ Green badge appears: "Uložené"
- Console: 💾 Answers auto-saved for TEST123
- Badge changes: "Ukladá sa..." → "Uložené" (500ms)

#### Step 3: Answer Second Question

```
Question: "Oznacte vsetky spisovne slova."
Check: ☑ jakub
Check: ☑ ano
Check: ☑ itinerar
```

**Expected:**
- Badge shows: "Ukladá sa..." while checking
- After 500ms: "Uložené"
- Console: 💾 Answers auto-saved for TEST123

#### Step 4: Refresh Page

```
Press: F5 or Ctrl+R (refresh)
```

**Expected:**
- Page reloads
- Console: 📂 Loaded saved answers for TEST123
- Console: ℹ️ Obnovené neuložené odpovede
- Question 1: "dobre" is still selected ✅
- Question 2: All 3 checkboxes still checked ✅
- Badge shows: "Uložené"
- Timer shows correct remaining time (not reset!)

#### Step 5: Complete Test

```
Click: "Odoslať test"
```

**Expected:**
- Console: 🗑️ Cleared saved answers for TEST123
- Redirects to results page
- localStorage cleared

### 3. Test Session-Based Timer

#### Test A: Timer Persists on Refresh

```
1. Visit: http://localhost:3001/test?code=TIMER1
   Timer shows: 14:45
   Console: "Created new test session for code: TIMER1"

2. Wait 2 minutes
   Timer shows: 12:45

3. Refresh page (F5)
   Timer shows: 12:45 ✅ (NOT 14:45!)
   Console: "Retrieved existing test session for code: TIMER1"
```

#### Test B: Different Users Have Different Sessions

```
1. Tab 1: http://localhost:3001/test?code=USER-A
   Timer starts: 14:45

2. Tab 2: http://localhost:3001/test?code=USER-B
   Timer starts: 14:45 (independent!)

3. Wait 5 minutes in Tab 1
   Tab 1 timer: 9:45
   Tab 2 timer: 14:45 (unchanged!)

4. Refresh Tab 1
   Tab 1 timer: 9:45 ✅
   Tab 2 timer: 14:45 ✅
```

### 4. Test Complete Flow

```
1. Enter code: COMPLETE-TEST
2. Answer all questions
3. Click "Odoslať test"
4. Verify:
   - Results page shows score
   - Question 1: Correct/Incorrect
   - Question 2: Correct/Incorrect
   - Percentage calculated
   - localStorage cleared
```

## Browser Console Tests

### Check Saved Data

```javascript
// View saved answers
localStorage.getItem('test-answers-TEST123')

// Pretty print
JSON.parse(localStorage.getItem('test-answers-TEST123'))

// Output:
{
  "answers": {
    "question1": "Item 1",
    "question2": ["Item 1", "Item 2", "Item 3"]
  },
  "currentPageIndex": 0,
  "lastSaved": "2025-10-11T10:05:23.456Z"
}
```

### Monitor Save Events

```javascript
// Watch for saves
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key, value) {
  if (key.startsWith('test-answers-')) {
    console.log('💾 SAVE:', key, JSON.parse(value))
  }
  return originalSetItem.apply(this, arguments)
}
```

### Clear All Test Data

```javascript
// Clear all test-related storage
Object.keys(localStorage)
  .filter(key => key.startsWith('test-answers-'))
  .forEach(key => {
    console.log('Clearing:', key)
    localStorage.removeItem(key)
  })
```

## Visual Test Checklist

### Header Elements

```
When test loads:
□ Title shows: "Digitálny výberový test"
□ Access code badge visible
□ Timer badge visible (if showTimer: true)
□ Page counter visible (if multiple pages)

After answering questions:
□ "Uložené" badge appears (green)
□ Badge shows "Ukladá sa..." briefly when typing
□ Badge shows "Uložené" after 500ms
```

### Question Display

```
□ All questions from page.elements visible
□ Question numbering: "Otázka 1", "Otázka 2"
□ Visual separation between questions (borders)
□ Radio buttons work for single choice
□ Checkboxes work for multiple choice
□ All choices from JSON displayed
```

### Auto-Save Behavior

```
□ Typing in textarea triggers save after 500ms
□ Selecting radio button triggers save after 500ms
□ Checking/unchecking checkbox triggers save after 500ms
□ Navigating to next page saves immediately
□ Refresh preserves all answers
□ Refresh preserves page position
```

### Timer Behavior

```
□ Timer counts down every second
□ Timer color changes: blue → orange → red
□ Refresh doesn't reset timer
□ Timer based on backend dates
□ Different codes have different timers
□ Time expiry triggers auto-submit
```

### Completion

```
□ "Odoslať test" button visible on last page
□ Clicking redirects to results
□ localStorage cleared on completion
□ Results page shows score
□ Results page shows correct/incorrect per question
```

## Network Tests

### Test Offline Mode

```
1. Start test and answer questions
2. Open DevTools → Network tab
3. Select "Offline" mode
4. Answer more questions
   ✅ Answers still save to localStorage
   ✅ Visual indicator works
5. Go back online
6. Complete test
   ✅ Submits successfully
```

### Test Slow Network

```
1. DevTools → Network → Slow 3G
2. Start test
3. Answer questions
   ✅ Auto-save works (localStorage is local)
   ✅ No delay in saving
4. Complete test
   ⏳ May take longer to submit to backend
   ✅ But answers are safe in localStorage until submitted
```

## Edge Cases

### Test 1: Browser Crash Recovery

```
1. Start test: TEST-CRASH
2. Answer 3 questions
3. Force quit browser (Cmd+Q / Alt+F4)
4. Reopen browser
5. Navigate to: /test?code=TEST-CRASH
   ✅ All 3 answers restored
   ✅ Page position restored
   ✅ Timer continues from correct time
```

### Test 2: Tab Close and Reopen

```
1. Start test in new tab
2. Answer questions
3. Close tab (Cmd+W / Ctrl+W)
4. Open new tab
5. Navigate to: /test?code=SAME-CODE
   ✅ Answers restored
   ✅ Timer continues
```

### Test 3: Multiple Refreshes

```
1. Start test
2. Answer question 1
3. Refresh (F5)
4. Answer question 2
5. Refresh (F5)
6. Answer question 3
7. Refresh (F5)
   ✅ All 3 answers present
   ✅ No data loss
```

### Test 4: Rapid Typing

```
1. Go to textarea question
2. Type very fast: "The quick brown fox jumps over the lazy dog"
   ✅ No lag in UI
   ✅ All text captured
   ✅ Saves after stopping (500ms)
   ✅ Console shows only 1 save (not 40+)
```

## Performance Metrics

### Expected Performance

```
Operation              Time      Impact
─────────────────────────────────────────
Save to localStorage   < 1ms     None
Load from localStorage < 1ms     None
Debounce wait         500ms     None
Timer update          < 1ms     None
Page render           < 50ms    None
```

### Memory Usage

```
Component state:       ~1 KB
localStorage data:     ~2-5 KB per test
Total footprint:       ~10 KB
```

### CPU Usage

```
Idle:                  0%
Typing:                < 1%
Timer running:         < 0.1%
Saving:                < 0.1%
```

## Console Output Examples

### Normal Flow

```
// Page load
📂 Loaded saved answers for TEST123 {
  answersCount: 0,
  lastSaved: undefined
}
Created new test session for code: TEST123
Using dates from backend: {
  start: '2025-10-11T10:00:00.000Z',
  end: '2025-10-11T10:15:00.000Z'
}

// User answers question
💾 Answers auto-saved for TEST123

// User refreshes
📂 Loaded saved answers for TEST123 {
  answersCount: 2,
  lastSaved: '2025-10-11T10:05:23.456Z'
}
ℹ️ Obnovené neuložené odpovede
Retrieved existing test session for code: TEST123

// User completes test
Score: { score: 1, total: 2, percentage: 50, details: [...] }
🗑️ Cleared saved answers for TEST123
```

## Debugging

### Check If Auto-Save Is Working

```javascript
// In browser console
setInterval(() => {
  const data = localStorage.getItem('test-answers-TEST123')
  if (data) {
    console.log('Saved answers:', JSON.parse(data).answers)
  }
}, 1000)
```

### Monitor Save Frequency

```javascript
let saveCount = 0
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key, value) {
  if (key.startsWith('test-answers-')) {
    saveCount++
    console.log(`Save #${saveCount}:`, key)
  }
  return originalSetItem.apply(this, arguments)
}
```

### Test Debouncing

```javascript
// Type quickly in textarea
// Should see:
// - No console logs while typing
// - One console log 500ms after you stop
// - Badge shows "Ukladá sa..." then "Uložené"
```

## Common Issues

### Issue: Answers Not Saving

**Possible Causes:**
1. localStorage disabled in browser
2. Private/Incognito mode
3. Storage quota exceeded
4. accessCode prop not passed

**Solution:**
```javascript
// Check if localStorage works
try {
  localStorage.setItem('test', '1')
  localStorage.removeItem('test')
  console.log('✅ localStorage available')
} catch (e) {
  console.error('❌ localStorage not available:', e)
}
```

### Issue: Old Answers Loading

**Possible Causes:**
1. Same access code used twice
2. localStorage not cleared

**Solution:**
```javascript
// Manually clear
localStorage.removeItem('test-answers-TEST123')

// Or clear on test start
if (isNewAttempt) {
  clearLocalStorage()
}
```

### Issue: Save Indicator Not Showing

**Possible Causes:**
1. No answers yet
2. isSaving state not updating
3. Badge CSS not loading

**Solution:**
```javascript
// Check component state
console.log('isSaving:', this.isSaving)
console.log('lastSavedTime:', this.lastSavedTime)
```

## Success Criteria

All tests pass when:

- ✅ Answers save automatically
- ✅ Visual indicator shows save status
- ✅ Refresh preserves answers
- ✅ Page position preserved
- ✅ Timer persists correctly
- ✅ Multiple users isolated
- ✅ Completion clears storage
- ✅ No console errors
- ✅ Performance is smooth

## Support

For testing issues:
- Check console logs
- Verify localStorage in DevTools
- See individual MD files for features
- Contact: podpora@vyberko.sk

