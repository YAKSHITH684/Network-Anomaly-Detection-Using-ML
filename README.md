# Anomaly Detection in Network Traffic — Frontend/Backend Split

Originally a single Flask app that server-rendered HTML. Now split into:

- **`backend/`** — a Flask JSON API only (no templates). Trains/evaluates six
  ML classifiers (Naive Bayes, Logistic Regression, SVM, Random Forest,
  XGBoost, LightGBM) on network traffic data and exposes everything over
  `/api/...` endpoints.
- **`frontend/`** — plain HTML/CSS/JS (no framework, no build step) that
  calls the backend over `fetch()`. Can be hosted anywhere that serves
  static files.

They talk to each other over HTTP with a bearer token (returned at login),
not cookies — this avoids cross-origin cookie headaches when frontend and
backend live on two different domains (e.g. two separate Render services).

## Run it locally

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python app.py
```
Runs on `http://127.0.0.1:5000`. Health check: `curl http://127.0.0.1:5000/api/health`.

**Frontend:**
```bash
cd frontend
python -m http.server 8000
```
Open `http://127.0.0.1:8000`. The page defaults to talking to
`http://127.0.0.1:5000` automatically (see `js/config.js`) — no extra
config needed for local use.

Login with `admin` / `admin123`, upload `backend/dataset/train.csv` (or your
own CSV with an `attack_type` label column), click **Preprocess & Split**,
train a model or two, then **Show Accuracy Graphs** or **Predict** on
`backend/dataset/test.csv`.

## Deploy to Render

This repo includes a `render.yaml` Blueprint that deploys **both** services
in one shot:

1. Push this repo to GitHub/GitLab.
2. In the Render dashboard: **New +** → **Blueprint** → connect the repo.
3. Render provisions two services:
   - `anomaly-detection-backend` (Python web service, free plan)
   - `anomaly-detection-frontend` (static site, free plan)
4. Click **Apply**. First backend deploy takes a few minutes (installs
   pandas/scikit-learn/xgboost/lightgbm/matplotlib etc.).
5. The frontend's build step automatically writes the backend's live URL
   into `env.js`, so once both are up the frontend already knows where to
   send API calls — just open the frontend's `.onrender.com` URL.

**If the frontend can't reach the backend** (e.g. you deployed them
separately, not via the Blueprint): the frontend's default backend URL
lives in `frontend/env.js` (or `js/config.js`'s `DEFAULT_API_BASE_URL` as
a fallback). Update it to your backend's `.onrender.com` URL (no trailing
slash) and redeploy the static site. You can also override it per-visit
with a URL param: `?api=https://your-backend.onrender.com` — this saves
to the browser's `localStorage` so it's remembered on later visits.

### Manual deploy (without the Blueprint)

**Backend** — New + → Web Service → connect repo → set **Root Directory**
to `backend`:
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app --workers 1 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`
- Env var: `SECRET_KEY` = any random string
- Env var (optional): `GROQ_API_KEY` = your Groq API key, to enable
  the in-app chat assistant. Get one at https://console.groq.com. If
  unset, the app works normally and the chat widget shows a setup notice
  instead of a composer. You can also override the model it uses with
  `GROQ_CHAT_MODEL` (defaults to `openai/gpt-oss-120b`).

**Frontend** — New + → Static Site → connect repo → set **Root Directory**
to `frontend`:
- Build command: (leave blank, or `echo "window.DEFAULT_API_BASE_URL = '';" > env.js`)
- Publish directory: `.`
- After deploy, set the backend URL via the in-page "Backend API" box as
  described above.

### Important notes about this app's design (carried over from the original)

- **State is in-memory, not per-user/per-database.** The uploaded dataset
  and train/test split (`DATA_STORE` in `backend/app.py`) live in a single
  global Python object shared by all users — fine for a single-user demo,
  but **don't scale the backend to multiple Gunicorn workers/dynos**, each
  worker has its own memory. The provided `Procfile`/`render.yaml`
  intentionally use `--workers 1 --threads 4`.
- Per-user state that *is* isolated: which models each logged-in user has
  trained and their accuracies (`model_metrics`), keyed by that user's
  bearer token.
- **Storage is ephemeral on Render's free tier.** Uploaded CSVs and trained
  `.joblib` models are written to local disk and wiped on redeploy/restart.
  For persistence you'd need a persistent disk (paid plan) or external
  storage (e.g. S3).
- **XGBoost/LightGBM are optional.** If unavailable, those two "train"
  buttons stay disabled and everything else still works.
- **CORS** defaults to `*` (any origin) since auth is a bearer token, not
  cookies, so there's no credentialed-CORS risk. Set the backend's
  `CORS_ORIGINS` env var to your frontend's exact URL if you want to lock
  it down.

## API reference (backend)

| Method | Path                              | Auth | Notes |
|---|---|---|---|
| GET  | `/api/health`                     | no  | liveness check |
| POST | `/api/auth/login`                 | no  | `{username, password}` → `{token}` |
| POST | `/api/auth/logout`                | yes | invalidates the token |
| GET  | `/api/state`                      | yes | logs, dataset preview, trained-model metrics |
| POST | `/api/dataset/upload`             | yes | multipart `file` (CSV) |
| POST | `/api/dataset/preprocess`         | yes | clean, encode, scale, split, (SMOTE if available) |
| POST | `/api/models/train/<model_name>`  | yes | `naive_bayes`, `logistic`, `svm`, `random_forest`, `xgboost`, `lightgbm` |
| GET  | `/api/models/graphs`              | yes | base64 PNG accuracy bar + pie charts |
| GET  | `/api/models/confusion/<model>`   | yes | base64 PNG confusion matrix |
| POST | `/api/predict`                    | yes | multipart `file` (CSV), uses best-accuracy trained model |
| POST | `/api/chat`                       | yes | `{message, history?}` → `{reply}`. Requires `GROQ_API_KEY`; the assistant answers grounded in the current dataset/model/prediction state |

All authenticated routes expect `Authorization: Bearer <token>`.
