// Patient-First Homepage Optimization
// Reduces friction for 90%+ patient users

1. UPDATE BUTTON STYLING (src/app/page.tsx):
   - Patient: flex-1 py-4 bg-blue-50 border-blue-500 text-blue-600 (larger, primary)
   - Pharmacy: flex-1 py-2 bg-gray-50 border-gray-200 text-gray-500 (smaller, secondary)
   - Set role="patient" as default

2. ADD PATIENT FOCAL ELEMENTS:
   - Medical icons (💊, 🏥, 📋)
   - Trust badges: "Join 10,000+ patients"
   - Patient benefits list

3. PHARMACY ACCESS HANDLING:
   - Role selection stays same
   - When pharmacy selected + Register clicked:
     * Show modal explaining verification requirements
     * Allow continue with warning
     * Keep pharmacy option available

4. VISUAL HIERARCHY:
   - Hero section: "Find Your Medications Fast"
   - Patient CTA: Large, prominent, benefits preview
   - Pharmacy option: Smaller, secondary placement

5. SMART BEHAVIOR:
   - URL detection: /pharmacy?ref=pharmacy → auto-select pharmacy
   - Referral links: honor pharmacy ref if present
   - Mobile-first: Larger touch targets, simplified form