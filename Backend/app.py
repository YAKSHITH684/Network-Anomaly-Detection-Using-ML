# app.py — Anomaly Detection backend (pure JSON REST API)
#
# This is the backend half of a frontend/backend split. It exposes a small
# JSON API (no server-rendered HTML) that the static frontend in ../frontend
# talks to over fetch(). Auth is a simple bearer token (not cookies), which
# avoids cross-origin cookie/SameSite headaches when the frontend and backend
# are deployed as two separate Render services on two separate domains.
#
# NOTE on architecture (carried over from the original single-file app):
# state (uploaded dataset, train/test split, trained models) is kept in
# memory in this process, not in a database. That's fine for a single-user
# demo but means: (a) don't scale this to multiple Gunicorn workers/dynos,
# each worker has its own memory, and (b) uploaded files / trained models
# are wiped on restart or redeploy unless you attach persistent storage.

import os
import io
import base64
import secrets
import traceback

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from pandas.api.types import is_numeric_dtype

from flask import Flask, request, jsonify

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier

import joblib

# Optional models
try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False

try:
    import lightgbm as lgb
    HAS_LGB = True
except Exception:
    HAS_LGB = False

# Optional SMOTE
try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except Exception:
    HAS_SMOTE = False

# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "super-secret-key")

# Comma-separated list of allowed origins, or "*" for any (default).
# Set this to your deployed frontend URL(s) on Render for tighter CORS.
# Implemented by hand (no Flask-Cors dependency) since auth here is a
# bearer token, not cookies, so we never need credentialed CORS requests.
_cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
_cors_origins = "*" if _cors_origins_raw.strip() == "*" else [o.strip() for o in _cors_origins_raw.split(",")]


@app.after_request
def add_cors_headers(resp):
    origin = request.headers.get("Origin")
    if _cors_origins == "*":
        resp.headers["Access-Control-Allow-Origin"] = "*"
    elif origin and origin in _cors_origins:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def cors_preflight(_any):
    return "", 204


UPLOAD_FOLDER = "uploads"
MODEL_FOLDER = "models"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

DEMO_USER = {"username": "admin", "password": "admin123"}

# token -> {"username": str, "model_metrics": {model_name: {"accuracy": float}}}
TOKENS = {}

# Shared, in-memory dataset/model state (single-user demo — see note above)
DATA_STORE = {
    "df": None,
    "X_train": None, "X_test": None,
    "y_train": None, "y_test": None,
    "scaler": None,
    "feature_columns": None,
    "target_encoder": None,
}

LOGS = []
LAST_CONFUSION = {}  # model_name -> base64 png


def add_log(msg):
    LOGS.insert(0, str(msg))
    del LOGS[200:]


# --------------------------------------------------------------------------
# Auth helpers
# --------------------------------------------------------------------------

def get_token_from_request():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[len("Bearer "):].strip()
    return None


def require_auth():
    """Returns (token, session_dict) or (None, None) if unauthenticated."""
    token = get_token_from_request()
    if not token or token not in TOKENS:
        return None, None
    return token, TOKENS[token]


def auth_error():
    return jsonify({"error": "Not authenticated. Please log in."}), 401


# --------------------------------------------------------------------------
# ML helpers
# --------------------------------------------------------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() == "csv"


def plot_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def df_preview(df, n=5):
    if df is None:
        return None
    head = df.head(n)
    return {
        "columns": [str(c) for c in head.columns],
        "rows": head.astype(object).where(pd.notnull(head), None).values.tolist(),
        "shape": list(df.shape),
    }


def aggregated_confusion_summary(cm: np.ndarray):
    total = int(cm.sum())
    tp = int(np.trace(cm))
    fp = total - tp
    fn = total - tp
    tn = 0
    return {"TP": tp, "FP": fp, "FN": fn, "TN": tn, "total": total}


def preprocess_df(df):
    """
    - Drops duplicates
    - Fill missing (numeric: median, non-numeric: mode)
    - Expects 'attack_type' as target
    - One-hot encodes categorical features (pd.get_dummies)
    - Scales all resulting numeric feature columns
    Returns: X_df, y_enc, scaler, target_le
    """
    df = df.copy()

    before = df.shape[0]
    df = df.drop_duplicates()
    after = df.shape[0]
    add_log(f"Dropped {before - after} duplicate rows.")

    for col in df.columns:
        if is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            mode = df[col].mode()
            df[col] = df[col].fillna(mode[0] if not mode.empty else "unknown")

    if "attack_type" not in df.columns:
        raise Exception("Dataset must contain an 'attack_type' column.")

    y = df["attack_type"].astype(str).copy()
    X = df.drop(columns=["attack_type"]).copy()

    X_dummies = pd.get_dummies(X, drop_first=False)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_dummies.values)
    X_scaled_df = pd.DataFrame(X_scaled, columns=X_dummies.columns)

    target_le = LabelEncoder()
    y_enc = target_le.fit_transform(y)

    add_log(f"One-hot encoded features: {len(X_dummies.columns)} columns. Classes: {list(target_le.classes_)}")

    return X_scaled_df, y_enc, scaler, target_le


AVAILABLE_MODELS = ["naive_bayes", "logistic", "svm", "random_forest", "xgboost", "lightgbm"]


def build_classifier(model_name):
    if model_name == "naive_bayes":
        return GaussianNB()
    if model_name == "logistic":
        return LogisticRegression(max_iter=2000, class_weight="balanced")
    if model_name == "svm":
        return SVC(probability=True, class_weight="balanced")
    if model_name == "random_forest":
        return RandomForestClassifier(n_estimators=200, class_weight="balanced")
    if model_name == "xgboost":
        if not HAS_XGB:
            raise ValueError("XGBoost not installed on the server.")
        return xgb.XGBClassifier(eval_metric="mlogloss", n_estimators=200)
    if model_name == "lightgbm":
        if not HAS_LGB:
            raise ValueError("LightGBM not installed on the server.")
        return lgb.LGBMClassifier(n_estimators=200)
    raise ValueError(f"Unknown model: {model_name}")


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()

    if username == DEMO_USER["username"] and password == DEMO_USER["password"]:
        token = secrets.token_hex(24)
        TOKENS[token] = {"username": username, "model_metrics": {}}
        add_log(f"{username} logged in.")
        return jsonify({"token": token, "username": username})

    return jsonify({"error": "Invalid credentials."}), 401


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    token, _ = require_auth()
    if token:
        add_log(f"{TOKENS[token]['username']} logged out.")
        TOKENS.pop(token, None)
    return jsonify({"ok": True})


@app.route("/api/state")
def state():
    token, sess = require_auth()
    if not token:
        return auth_error()

    return jsonify({
        "username": sess["username"],
        "logs": LOGS,
        "preview": df_preview(DATA_STORE["df"]),
        "model_metrics": sess["model_metrics"],
        "available_models": AVAILABLE_MODELS,
        "has_xgboost": HAS_XGB,
        "has_lightgbm": HAS_LGB,
        "has_smote": HAS_SMOTE,
        "has_split": DATA_STORE["X_train"] is not None,
    })


@app.route("/api/dataset/upload", methods=["POST"])
def upload():
    token, sess = require_auth()
    if not token:
        return auth_error()

    file = request.files.get("file")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Please upload a valid CSV file."}), 400

    try:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        df = pd.read_csv(filepath)
        DATA_STORE["df"] = df
        # Reset any previous split — a new dataset invalidates it.
        DATA_STORE.update({
            "X_train": None, "X_test": None, "y_train": None, "y_test": None,
            "scaler": None, "feature_columns": None, "target_encoder": None,
        })

        add_log(f"Uploaded: {file.filename} (Shape: {df.shape})")
        return jsonify({"ok": True, "preview": df_preview(df)})

    except Exception as e:
        add_log("Upload Error: " + str(e))
        add_log(traceback.format_exc())
        return jsonify({"error": f"Failed to read CSV: {e}"}), 400


@app.route("/api/dataset/preprocess", methods=["POST"])
def preprocess():
    token, sess = require_auth()
    if not token:
        return auth_error()

    if DATA_STORE["df"] is None:
        return jsonify({"error": "Upload a dataset first."}), 400

    try:
        df = DATA_STORE["df"]
        X_df, y_arr, scaler, target_le = preprocess_df(df)

        X_train_df, X_test_df, y_train, y_test = train_test_split(
            X_df, y_arr, test_size=0.2, random_state=42, stratify=y_arr
        )

        smote_applied = False
        if HAS_SMOTE:
            try:
                sm = SMOTE(random_state=42)
                X_train_res, y_train_res = sm.fit_resample(X_train_df.values, y_train)
                X_train_df = pd.DataFrame(X_train_res, columns=X_train_df.columns)
                y_train = y_train_res
                smote_applied = True
                add_log("Applied SMOTE to training set.")
            except Exception as e:
                add_log("SMOTE failed: " + str(e))
                add_log(traceback.format_exc())
        else:
            add_log("imblearn.SMOTE not available; skipping SMOTE.")

        DATA_STORE.update({
            "X_train": X_train_df.values,
            "X_test": X_test_df.values,
            "y_train": y_train,
            "y_test": y_test,
            "scaler": scaler,
            "feature_columns": list(X_df.columns),
            "target_encoder": target_le,
        })

        add_log(f"Preprocessing OK | Train: {X_train_df.shape} Test: {X_test_df.shape}")

        return jsonify({
            "ok": True,
            "train_shape": list(X_train_df.shape),
            "test_shape": list(X_test_df.shape),
            "smote_applied": smote_applied,
            "classes": list(target_le.classes_),
        })

    except Exception as e:
        add_log("Preprocessing Error: " + str(e))
        add_log(traceback.format_exc())
        return jsonify({"error": f"Preprocessing failed: {e}"}), 400


@app.route("/api/models/train/<model_name>", methods=["POST"])
def train(model_name):
    token, sess = require_auth()
    if not token:
        return auth_error()

    if DATA_STORE["X_train"] is None:
        return jsonify({"error": "Run preprocessing first."}), 400

    X_train, X_test = DATA_STORE["X_train"], DATA_STORE["X_test"]
    y_train, y_test = DATA_STORE["y_train"], DATA_STORE["y_test"]

    try:
        clf = build_classifier(model_name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        add_log(f"Training model: {model_name} ...")
        clf.fit(X_train, y_train)

        preds = clf.predict(X_test)
        accuracy = float(accuracy_score(y_test, preds))
        cm = confusion_matrix(y_test, preds)
        agg = aggregated_confusion_summary(cm)

        add_log(f"Accuracy: {accuracy:.4f}")
        add_log(f"Confusion Matrix (Aggregated): TP={agg['TP']} FP={agg['FP']} FN={agg['FN']} TN={agg['TN']}")

        model_path = os.path.join(MODEL_FOLDER, f"{model_name}.joblib")
        joblib.dump({
            "model": clf,
            "feature_columns": DATA_STORE["feature_columns"],
            "scaler": DATA_STORE["scaler"],
            "target_encoder": DATA_STORE["target_encoder"],
        }, model_path)

        sess["model_metrics"][model_name] = {"accuracy": accuracy}

        try:
            fig = plt.figure(figsize=(5, 4))
            sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
            plt.title(f"Confusion Matrix — {model_name}")
            LAST_CONFUSION[model_name] = plot_to_base64(fig)
        except Exception:
            add_log("Failed to render confusion matrix image.")

        return jsonify({
            "ok": True,
            "model_name": model_name,
            "accuracy": accuracy,
            "confusion_summary": agg,
        })

    except Exception as e:
        add_log("Training Error: " + str(e))
        add_log(traceback.format_exc())
        return jsonify({"error": f"Training failed: {e}"}), 400


@app.route("/api/models/graphs")
def graphs():
    token, sess = require_auth()
    if not token:
        return auth_error()

    model_metrics = sess["model_metrics"]
    if not model_metrics:
        return jsonify({"error": "Train at least one model first."}), 400

    names = list(model_metrics.keys())
    accs = [model_metrics[m]["accuracy"] for m in names]

    fig1 = plt.figure(figsize=(6, 4))
    sns.barplot(x=names, y=accs)
    plt.ylim(0, 1)
    plt.title("Model Accuracies")
    acc_img = plot_to_base64(fig1)

    fig2 = plt.figure(figsize=(5, 5))
    plt.pie(accs, labels=names, autopct="%1.1f%%")
    plt.title("Model Contribution")
    pie_img = plot_to_base64(fig2)

    return jsonify({"acc_img": acc_img, "pie_img": pie_img})


@app.route("/api/models/confusion/<model_name>")
def confusion_image(model_name):
    token, _ = require_auth()
    if not token:
        return auth_error()
    b64 = LAST_CONFUSION.get(model_name)
    if not b64:
        return jsonify({"error": "No confusion matrix available for this model."}), 404
    return jsonify({"image": b64})


@app.route("/api/predict", methods=["POST"])
def predict():
    token, sess = require_auth()
    if not token:
        return auth_error()

    file = request.files.get("file")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Upload a valid CSV file."}), 400

    model_metrics = sess["model_metrics"]
    if not model_metrics:
        return jsonify({"error": "Train at least one model first."}), 400

    best_model = max(model_metrics.items(), key=lambda x: x[1]["accuracy"])[0]
    model_path = os.path.join(MODEL_FOLDER, f"{best_model}.joblib")

    try:
        saved = joblib.load(model_path)
        clf = saved["model"]
        feature_columns = saved.get("feature_columns") or DATA_STORE.get("feature_columns")
        scaler = saved.get("scaler") or DATA_STORE.get("scaler")
        target_le = saved.get("target_encoder") or DATA_STORE.get("target_encoder")

        df = pd.read_csv(file)
        if "attack_type" in df.columns:
            df = df.drop(columns=["attack_type"])

        incoming = pd.get_dummies(df, drop_first=False)

        if feature_columns is None:
            return jsonify({"error": "Feature metadata missing; retrain a model first."}), 400

        incoming_aligned = incoming.reindex(columns=feature_columns, fill_value=0)
        X_scaled = scaler.transform(incoming_aligned.values)
        preds = clf.predict(X_scaled)

        pred_labels = target_le.inverse_transform(preds) if target_le is not None else preds.astype(str)

        out_df = df.copy()
        out_df["prediction"] = pred_labels

        add_log(f"Prediction OK using {best_model}. (rows: {len(preds)})")

        preview = df_preview(out_df, n=200)
        return jsonify({
            "ok": True,
            "model_name": best_model,
            "columns": preview["columns"],
            "rows": preview["rows"],
            "row_count": int(len(preds)),
        })

    except Exception as e:
        add_log("Prediction Error: " + str(e))
        add_log(traceback.format_exc())
        return jsonify({"error": f"Prediction failed: {e}"}), 400


# --------------------------------------------------------------------------
# MAIN
# --------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", debug=debug, port=port)
