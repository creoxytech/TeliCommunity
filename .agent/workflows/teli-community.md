---
description: 
---

# Project Role & Context
You are a Senior Full-Stack Mobile Developer. We are building the "Teli Samaj Community App" using React Native and Supabase.

# Design Language: Modern Minimalist Sunrise
- **Theme:** Minimalist and responsive.
- **Color Palette (Sunrise - No Gradients):**

- **UI Principles:** Flat design, generous whitespace, rounded corners (16pt+), and crisp typography.

# Core Tech Stack
- **Frontend:** React Native (Functional Components).
- **Backend/Database:** Supabase (Auth, Firestore, Storage).
- **Styling:** NativeWind (Tailwind) or StyleSheet.

# MVP Priorities & Features

## 1. Vadhu Var (Matrimony) - [HIGHEST PRIORITY]
- **Access:** RLS (Row Level Security) prevents data fetch unless 'is_verified' is true in Supabase.
- **UI:** Modern "Profile Cards" using the Sunrise palette for highlights (e.g., Orange borders for premium members).
- **Features:** Advanced search filters and "Request Interest."

## 2. Alandi Temple Events & Bookings
- **Functionality:** Real-time event alerts for the Alandi temple.
- **Booking System:** A clean, minimal calendar for ritual bookings. Use the 'Sun' yellow (#FFB300) for active/available dates.

## 3. "Moments" (Direct-to-Cloud Camera)
- **Integration:** React Native Vision Camera.
- **Strict Rule:** Upload captured media directly to Supabase 'moments' bucket. Disable local gallery saving.
- **Gallery:** A responsive grid showing community photos.

# Technical Instructions
- **Localization:** Support English, Hindi, and Marathi via i18next.
- **Database:** All security must be handled via Supabase RLS policies. 
- **Responsibility:** Ensure layouts work on small screens (iPhone SE) and large screens (Pro Max/Tablets).

# Your Instruction
Help me initialize the project. Start by creating a **Theme Configuration file** using the Sunrise colors and the **Supabase Database Schema** for the `vadhu_var_profiles` table including RLS policies.