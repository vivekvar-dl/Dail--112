# Dial 112 Analyzer - Andhra Pradesh Police

This project is an AI-driven emergency call processing system designed to assist the Andhra Pradesh Police in analyzing and processing emergency calls made to the "Dial 112" service. It provides tools for single and batch audio file processing, and visualization of processed tickets on a map.

## Features

- **Single Audio Processing**: Upload and process individual emergency call audio files to extract key information.
- **Batch Audio Processing**: Process multiple audio files at once.
- **Interactive Map View**: Visualize the locations of processed emergency tickets on an interactive Google Map.
- **System Demo**: A demonstration of the system's capabilities.

## Tech Stack

- **Frontend**:
  - [Next.js](https://nextjs.org/) - React framework for server-rendered applications.
  - [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
  - [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
  - [Google Maps React](https://www.npmjs.com/package/@react-google-maps/api) - Google Maps integration for React.

- **Backend**:
  - [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Serverless functions for the API.
  - [Supabase](https://supabase.io/) - Backend-as-a-Service for database and storage.
  - [Google Generative AI](https://ai.google/) - For processing audio files and extracting information.

- **Other Tools**:
  - [TypeScript](https://www.typescriptlang.org/)
  - [Formidable](https://www.npmjs.com/package/formidable) - For parsing form data, especially file uploads.
  - [React Dropzone](https://react-dropzone.js.org/) - For creating a drag 'n' drop file upload zone.
  - [XLSX](https://www.npmjs.com/package/xlsx) - For parsing and writing Excel files.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need to have Node.js and npm (or yarn) installed on your machine.

You will also need to create a `.env.local` file in the root of the project and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_API_KEY=your_google_api_key
```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/my-app.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the development server
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

The application has four main tabs:

-   **System Demo**: Provides an overview of the system's features.
-   **Single Audio**: Upload a single audio file for processing.
-   **Batch Processing**: Upload a zip file or a directory of audio files for batch processing.
-   **Processed Tickets**: View all the processed tickets on a map, with details for each ticket.

## API Endpoints

The following API endpoints are available:

-   `POST /api/process-audio`: Processes a single audio file.
-   `POST /api/process-batch`: Processes a batch of audio files.
-   `GET /api/tickets`: Retrieves all processed tickets.
-   `GET /api/tickets/export`: Exports all tickets to an Excel file.

## Project Structure

The project is organized as follows:

```
my-app/
├── app/
│   ├── api/
│   │   ├── process-audio/
│   │   ├── process-batch/
│   │   └── tickets/
│   ├── (main pages)
├── components/
│   ├── AudioUpload.tsx
│   ├── BatchAudioUpload.tsx
│   ├── GoogleMapsProvider.tsx
│   ├── ProcessingResults.tsx
│   ├── SystemDemo.tsx
│   └── TicketsWithMap.tsx
├── lib/
│   ├── (utility functions)
├── public/
│   ├── (static assets)
├── sql/
│   ├── (database schemas)
├── .env.local.example
├── next.config.ts
├── package.json
└── README.md
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
