# Performance Evaluation Tool

A simple multi-company monthly performance feedback tool.

## Stack

- React + Vite
- Node.js + Express
- Prisma
- PostgreSQL

## Requirements Covered

- Multiple companies use the same application/login.
- Employees can give and receive monthly feedback.
- Feedback has 5 fixed parameters, each with a score and reason.
- Reporting relationships support both hierarchical and flat organizations.
- HR can see pending/submitted feedback for the current month.
- Employees can see their historical scores by parameter.
- Seed data includes Ashoka Textiles and Bright Path Consulting.

## Assumptions

- Each employee belongs to one company.
- An employee can both give and receive feedback.
- Reporting relationships are stored separately from employees.
- Feedback assignments are created for each reviewer/employee/month combination so pending feedback can be tracked directly.
- The five parameters are fixed and shared across companies.
- Submitted feedback is historical and remains associated with the reviewer and recipient even if reporting relationships later change.
- Users only access data belonging to their company.

## Run

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
