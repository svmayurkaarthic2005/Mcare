# Healthcare Management Platform

A comprehensive healthcare management system built with modern web technologies.
MCare is a full-stack healthcare management platform designed to digitally streamline patient–doctor interactions while ensuring data security, real-time updates, and efficient medical workflows. The platform centralizes healthcare operations such as appointment scheduling, emergency handling, medical record storage, prescriptions, and patient health tracking into a single secure system.

Patients can book regular or emergency appointments by selecting doctor specialization, consultation type (online or offline), and available time slots. Emergency bookings use an automated escalation mechanism that identifies available doctors in real time and instantly notifies them through workflow automation. Patients can track their complete medical journey using a health timeline, manage medications with daily intake logs, securely store medical documents, and receive prescriptions and notifications via email and WhatsApp.

Doctors access a dedicated dashboard to review and manage appointment requests, approve or reject consultations, handle emergency cases, upload prescriptions, control availability, and review past consultation history along with patient feedback. For online consultations, doctors can securely share Zoom meeting links and credentials.

MCare implements strict role-based access control and row-level security to ensure that sensitive medical data is accessible only to authorized users. Real-time updates keep both patients and doctors informed of appointment status changes and emergency progress. The system is built using React and TypeScript for the frontend, Supabase for authentication, database, storage, and real-time services, and n8n for workflow automation and notifications. The platform is production-ready, scalable, and designed to meet modern healthcare security and usability standards

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Development

- **Edit locally** - Clone the repository and use your preferred IDE
- **GitHub** - Make changes directly in GitHub by clicking the Edit button
- **GitHub Codespaces** - Launch a Codespace environment for cloud-based development
