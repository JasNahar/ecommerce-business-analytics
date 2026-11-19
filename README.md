# MachineMemory AI

MachineMemory AI preserves industrial maintenance knowledge and helps teams identify compatible spare parts for aging equipment.

## Current starter

The repository currently contains a responsive Next.js dashboard prototype for:

- Factory and machine health
- Repair-memory activity
- Technician knowledge capture
- AI diagnosis workspace entry point
- Obsolete spare-part discovery entry point

## Run locally

Install Node.js 20+ and run:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Planned architecture

- Next.js and TypeScript frontend
- FastAPI agent service
- PostgreSQL for operational data
- pgvector for technical knowledge retrieval
- Object storage for manuals, images, audio, and video
- Agent orchestration for diagnosis, parts discovery, and knowledge curation
