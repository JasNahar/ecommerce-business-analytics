FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NEXT_PUBLIC_API_URL="" npm run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY . .
COPY --from=frontend /app/out ./out
RUN python scripts/load_sqlite.py && python ml/train.py
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
