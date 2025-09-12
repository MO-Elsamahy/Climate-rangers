# Climate Rangers Training Program

A professional landing page and application portal for the Climate Rangers Training Program by EMAM Organization.

## 🌍 Project Overview

This project provides a comprehensive platform for climate diplomacy training collaboration, featuring:

- **Professional Landing Page**: Showcasing the 5-module training program
- **Application Portal**: For organizations and experts to apply for collaboration
- **Admin Dashboard**: To review and manage applications
- **Responsive Design**: Optimized for all devices

## 🚀 Features

### Landing Page (`index.html`)
- Modern, responsive design with climate-themed colors
- Interactive hero section with floating cards
- Detailed program structure and modules
- Partnership opportunities section
- Professional footer with social media links

### Application Portal (`portal.html`)
- Multi-step application form
- Dynamic topic and module selection
- File upload for CVs and organization logos
- Real-time form validation
- Integration with Supabase backend

### Admin Dashboard (`admin.html`)
- Secure login system
- Application review and management
- Status tracking (Pending, Approved, Rejected)
- File viewing capabilities
- Responsive admin interface

## 🛠 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database, Storage, Authentication)
- **Styling**: Custom CSS with CSS Variables and Grid/Flexbox
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)

## 📁 Project Structure

```
climate-rangers/
├── index.html              # Main landing page
├── portal.html             # Application portal
├── admin-login.html        # Admin login page
├── admin.html              # Admin dashboard
├── styles.css              # Main stylesheet
├── portal-styles.css       # Portal-specific styles
├── admin-styles.css        # Admin-specific styles
├── script.js               # Landing page JavaScript
├── portal-script.js        # Portal JavaScript
├── admin-script.js         # Admin JavaScript
├── supabase-config.js      # Supabase configuration
├── climate rangers.png     # Logo file
└── README.md               # This file
```

## 🎨 Design Features

- **Climate-themed Color Palette**: Green (#059669), Blue (#0ea5e9), Light Green (#84cc16)
- **Professional Typography**: Inter font family
- **Smooth Animations**: CSS transitions and keyframe animations
- **Interactive Elements**: Hover effects, floating cards, gradient backgrounds
- **Mobile-first Responsive Design**: Optimized for all screen sizes

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd climate-rangers
   ```

2. **Configure Supabase**
   - The project is already configured with Supabase
   - Database schema and policies are pre-configured
   - Admin credentials are set up

3. **Deploy**
   - Upload files to your web server or hosting platform
   - Ensure all files are in the root directory
   - The project works with static hosting (GitHub Pages, Netlify, Vercel)

## 📊 Database Schema

### Applications Table
- `id`: UUID (Primary Key)
- `application_id`: Unique application identifier
- `full_name`: Applicant's full name
- `organization`: Organization name
- `organization_type`: NGO, IGO, Governmental, Private sector, University
- `email`: Contact email
- `phone`: Phone number
- `selected_topic`: Chosen training topic
- `selected_module`: Chosen module within topic
- `motivation`: Why they chose this topic/module
- `cv_url`: Uploaded CV file URL
- `logo_url`: Organization logo URL (optional)
- `status`: pending, approved, rejected
- `created_at`: Application timestamp
- `reviewed_at`: Review timestamp
- `reviewed_by`: Admin who reviewed
- `admin_notes`: Admin comments

### Admin Users Table
- `id`: Serial (Primary Key)
- `email`: Admin email
- `password_hash`: Hashed password
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Secure file upload to Supabase Storage
- Admin authentication system
- Input validation and sanitization
- CSRF protection through Supabase

## 🌐 Live Demo

[Add your deployed URL here]

## 📞 Contact

**EMAM Organization**
- Email: info@emamngo.com
- Website: www.emamngo.com

## 📄 License

© 2024 EMAM Organization. All rights reserved.

---

**Climate Rangers Training Program - Empowering Climate Leaders Worldwide** 🌍
