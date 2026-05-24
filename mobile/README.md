# Insta FastAPI Mobile

React Native frontend for the Instagram Clone FastAPI backend.

## Run

Start backend from the project root:

```bash
uvicorn main:app --reload
```

Start the mobile app:

```bash
cd mobile
npm start
```

For browser preview:

```bash
cd mobile
npm run web
```

## API URL

The app reads `EXPO_PUBLIC_API_URL`.

```bash
copy .env.example .env
```

Use the URL for your environment:

- Browser preview: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Physical phone: `http://<your-computer-lan-ip>:8000`

Auth uses `POST /users/login/`, stores the access and refresh tokens in SecureStore, and sends protected requests with `Authorization: Bearer <access_token>`.
