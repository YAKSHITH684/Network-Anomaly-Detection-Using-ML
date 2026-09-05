# 🚨 Network Anomaly Detection Using Machine Learning

A Machine Learning based web application that analyzes network traffic and identifies
whether the traffic is **Normal** or **Anomalous/Attack traffic**.

The project provides a web dashboard where users can upload network traffic data,
preprocess the dataset, train multiple Machine Learning models, compare their
performance, and predict network traffic.

---

## 📌 Project Overview

Network attacks such as DDoS, DoS, Port Scanning, and Brute Force can cause serious
security problems.

This project uses Machine Learning to analyze network traffic features and detect
suspicious activity automatically.

### Main Workflow

```text
Network Traffic Dataset
          ↓
Data Preprocessing
          ↓
Feature Encoding
          ↓
Feature Scaling
          ↓
Train / Test Split
          ↓
Machine Learning Models
          ↓
Model Evaluation
          ↓
Best Model Selection
          ↓
Network Traffic Prediction
          ↓
Normal / Anomaly
```

## 🎯 Objectives

- Detect abnormal network traffic.
- Classify network traffic into normal or attack categories.
- Compare multiple Machine Learning algorithms.
- Select the best-performing model.
- Provide a simple web interface for predictions.
- Display model performance using graphs and evaluation metrics.

## 🧠 Machine Learning Models

The application supports the following Machine Learning algorithms:

- Naive Bayes
- Logistic Regression
- Support Vector Machine (SVM)
- Random Forest
- XGBoost
- LightGBM

The models are trained using the uploaded network traffic dataset.

## 📊 Dataset

The dataset should contain network traffic features and a target column.

Example:

```
id,duration,protocol,service,source_bytes,destination_bytes,
source_packets,destination_packets,connection_count,
failed_logins,syn_count,packet_rate,bytes_rate,
attack_type
```

### Example Records

```
1,1.24,tcp,http,532,1240,12,15,3,0,2,18.5,750.4,Normal
2,0.08,tcp,http,120,45,78,5,35,0,65,920.2,1450.7,DDoS
3,4.31,tcp,ssh,850,920,20,18,5,6,3,12.4,450.8,BruteForce
4,0.03,tcp,http,90,20,95,3,50,0,82,1200.3,1800.6,DoS
```

### Target Column

The target column is:

```
attack_type
```

Possible values:

- Normal
- DoS
- DDoS
- PortScan
- BruteForce

## 🏗️ Project Structure

```
Network-Anomaly-Detection-Using-ML/
│
├── Backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── dataset/
│   │   ├── train.csv
│   │   └── test.csv
│   │
│   ├── models/
│   └── uploads/
│
├── Frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── start.bat
├── render.yaml
└── README.md
```

## ⚙️ Backend

The backend is developed using Python and Flask.

It provides APIs for:

- Dataset upload
- Dataset preprocessing
- Model training
- Model comparison
- Prediction
- Evaluation metrics

## 💻 Technologies Used

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Backend | Flask |
| Machine Learning | Scikit-learn, XGBoost, LightGBM |
| Data Processing | Pandas, NumPy |
| Frontend | HTML, CSS, JavaScript |
| Visualization | Matplotlib, Chart.js |

## 🚀 Installation

### Step 1: Clone the repository

```bash
git clone https://github.com/YAKSHITH684/Network-Anomaly-Detection-Using-ML.git
cd Network-Anomaly-Detection-Using-ML
```

### Step 2: Open Backend

```bash
cd Backend
```

### Step 3: Create Virtual Environment

Windows:

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Start Backend

```bash
python app.py
```

The backend will run at:

```
http://127.0.0.1:5000
```

## 🌐 Start Frontend

Open another terminal.

Go to the frontend directory:

```bash
cd Frontend
```

Start the local server:

```bash
python -m http.server 8000
```

Open:

```
http://127.0.0.1:8000
```

## 🔄 Application Workflow

### 1. Upload Dataset

Upload a CSV file containing network traffic records.

```
CSV Dataset
     ↓
Upload
```

### 2. Preprocess Dataset

The application performs:

```
Remove duplicates
       ↓
Handle missing values
       ↓
Encode categorical features
       ↓
Scale numerical features
       ↓
Split dataset
```

### 3. Train Models

The following models are trained:

- Naive Bayes
- Logistic Regression
- SVM
- Random Forest
- XGBoost
- LightGBM

### 4. Compare Models

The application calculates:

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix

Example:

```
Model              Accuracy
--------------------------------
Random Forest       97.8%
XGBoost             97.4%
LightGBM            97.1%
SVM                 94.2%
Logistic Regression 92.8%
Naive Bayes         88.5%
```

> The above values are example values only. Actual results depend on the dataset.

### 5. Select Best Model

The model with the highest evaluation score is selected for prediction.

```
Model Evaluation
       ↓
Compare Results
       ↓
Best Model
       ↓
Prediction
```

## 🔍 Anomaly Prediction

The trained model receives new network traffic and predicts its class.

Example:

```
Input Network Traffic
        ↓
Feature Processing
        ↓
Trained ML Model
        ↓
Prediction
```

Output:

```
Prediction: Normal
```

or

```
Prediction: DDoS
```

or

```
Prediction: PortScan
```

## 📈 Evaluation Metrics

The project uses the following metrics.

**Accuracy**
Measures the overall percentage of correct predictions.

**Precision**
Measures how many predicted attacks are actually attacks.

**Recall**
Measures how many actual attacks were successfully detected.

**F1 Score**
Provides a balance between precision and recall.

**Confusion Matrix**
Shows:

- True Positive
- True Negative
- False Positive
- False Negative

## 🖥️ Web Dashboard

The frontend provides an interactive dashboard for:

- Dataset upload
- Data preprocessing
- Model training
- Model comparison
- Performance visualization
- Traffic prediction

## 🔐 Real-World Applications

This project can be used as a foundation for:

- Intrusion Detection Systems
- Network Monitoring
- DDoS Detection
- Brute Force Detection
- Port Scan Detection
- Cybersecurity Monitoring
- Enterprise Network Security

## 🔮 Future Enhancements

Future versions can include:

- Real-time packet capture
- Live network traffic monitoring
- Deep Learning models
- Isolation Forest for unsupervised anomaly detection
- Autoencoder-based anomaly detection
- Real-time alerts
- Email notifications
- Security dashboard
- Cloud deployment
- Docker support

## ⚠️ Important Note

The current implementation uses supervised Machine Learning classification because
the training dataset contains attack labels.

Therefore, the system primarily performs:

```
Known Network Traffic
        ↓
Classification
        ↓
Normal / Known Attack Type
```

For detecting previously unseen anomalies, the project can be extended with:

- Isolation Forest
- Autoencoder
- One-Class SVM

## 👨‍💻 Author

**YAKSHITH**

GitHub: [https://github.com/YAKSHITH684](https://github.com/YAKSHITH684)

Repository: [https://github.com/YAKSHITH684/Network-Anomaly-Detection-Using-ML](https://github.com/YAKSHITH684/Network-Anomaly-Detection-Using-ML)

## ⭐ Conclusion

Network Anomaly Detection Using Machine Learning provides an automated approach to
analyzing network traffic and identifying suspicious activities.

The combination of Machine Learning, Flask, and a web-based dashboard makes the
project suitable for learning, academic demonstrations, and as a foundation for
future cybersecurity applications.
