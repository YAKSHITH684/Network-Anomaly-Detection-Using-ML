# 🚨 Network Anomaly Detection Using Machine Learning

A Machine Learning-based web application designed to detect unusual network traffic and identify potential cybersecurity threats.

The project analyzes network traffic data and uses multiple Machine Learning algorithms to classify traffic as normal or anomalous. It also provides a web-based dashboard for interacting with the trained models and viewing predictions.

## 🌐 Live Demo

🔗 **Live Application:**  
https://network-anomaly-detection-using-ml-1.onrender.com/

### Demo Login

```text
Username: admin
Password: admin123
```

The application provides a Network Traffic Analysis dashboard for analyzing network activity.

## 📌 Project Overview

Network traffic contains a large amount of information that can be used to identify suspicious or abnormal behavior.

This project implements a Machine Learning pipeline that:

- Processes network traffic datasets
- Performs data preprocessing
- Trains multiple Machine Learning models
- Compares model performance
- Detects anomalous network traffic
- Generates predictions
- Provides an interactive web dashboard
- Helps identify potential cybersecurity threats

## 🎯 Objectives

- Detect abnormal network traffic automatically
- Apply Machine Learning techniques to cybersecurity
- Compare different classification algorithms
- Identify the best-performing model
- Build a user-friendly anomaly detection dashboard
- Deploy the application as a web-based solution

## 🤖 Machine Learning Models

The project evaluates multiple Machine Learning algorithms:

- Naive Bayes
- Logistic Regression
- Support Vector Machine (SVM)
- Random Forest
- XGBoost
- LightGBM

These models are trained and evaluated to determine their effectiveness for network anomaly detection.

## 🔄 Machine Learning Workflow

```
Network Traffic Dataset
        ↓
Data Preprocessing
        ↓
Data Cleaning
        ↓
Feature Selection
        ↓
Feature Encoding / Scaling
        ↓
Train-Test Split
        ↓
Machine Learning Models
        ↓
Model Evaluation
        ↓
Best Model Selection
        ↓
Anomaly Prediction
        ↓
Web Dashboard
```

## 📊 Model Evaluation

The models are compared using performance metrics such as:

- Accuracy
- Precision
- Recall
- F1-Score
- Confusion Matrix

Comparative visualizations are used to understand the performance of each algorithm.

## 🖥️ Application Features

### 🔐 Authentication
The application provides a login interface before accessing the anomaly detection dashboard.

### 🌐 Network Traffic Analysis
Users can analyze network traffic and generate predictions using the trained Machine Learning model.

### 🤖 ML-Based Prediction
The system processes network traffic features and predicts whether the traffic is normal or anomalous.

### 📈 Model Comparison
Different Machine Learning algorithms can be evaluated and compared based on their performance.

### 📊 Data Visualization
Charts and visualizations help understand model performance and network traffic behavior.

### ☁️ Deployment
The application is deployed online using Render.

## 🛠️ Technologies Used

**Programming**
- Python

**Machine Learning**
- Scikit-learn
- XGBoost
- LightGBM
- NumPy
- Pandas

**Data Visualization**
- Matplotlib
- Seaborn

**Web Development**
- Flask
- HTML
- CSS
- JavaScript

**Deployment**
- Render

**Development Tools**
- Jupyter Notebook
- VS Code
- Git
- GitHub

## 📁 Project Structure

```
Network-Anomaly-Detection-Using-ML/
│
├── app.py
├── requirements.txt
├── README.md
│
├── models/
│   ├── model.pkl
│   └── ...
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/
│   ├── index.html
│   ├── login.html
│   └── dashboard.html
│
├── data/
│   └── dataset.csv
│
└── notebooks/
    └── anomaly_detection.ipynb
```

The exact folder structure may vary depending on the final version of the project.

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YAKSHITH684/Network-Anomaly-Detection-Using-ML.git
```

### 2. Navigate to the Project
```bash
cd Network-Anomaly-Detection-Using-ML
```

### 3. Create a Virtual Environment
```bash
python -m venv venv
```

### 4. Activate the Virtual Environment

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

### 5. Install Dependencies
```bash
pip install -r requirements.txt
```

### 6. Run the Application
```bash
python app.py
```

The application will be available at:
```
http://127.0.0.1:5000/
```

## 🔍 How It Works

**Step 1 — Data Collection**
Network traffic data is collected from a suitable network intrusion/anomaly detection dataset.

**Step 2 — Data Preprocessing**
The dataset is cleaned and prepared for Machine Learning. This includes:
- Handling missing values
- Encoding categorical features
- Feature scaling
- Removing unnecessary columns
- Preparing target labels

**Step 3 — Model Training**
Multiple Machine Learning algorithms are trained using the processed dataset.

**Step 4 — Model Evaluation**
The trained models are evaluated using standard classification metrics.

**Step 5 — Prediction**
The selected model receives network traffic features and determines whether the traffic is:
- Normal Traffic

or

- Anomalous / Suspicious Traffic

**Step 6 — Dashboard**
The prediction results are presented through the web interface.

## 🔐 Cybersecurity Applications

This project can be used as a foundation for:

- Intrusion Detection Systems
- Network Monitoring
- Cyber Threat Detection
- Suspicious Traffic Identification
- Security Analytics
- Network Security Research

## 🚀 Future Improvements

Possible improvements include:

- Real-time network traffic monitoring
- Deep Learning-based anomaly detection
- Real-time alert notifications
- Advanced dashboard analytics
- Automated threat classification
- Integration with SIEM platforms
- Cloud-based monitoring
- Streaming network traffic analysis
- Explainable AI for security predictions

## 📈 Key Learning Outcomes

Through this project, I gained practical experience in:

- Machine Learning
- Classification Algorithms
- Network Security
- Data Preprocessing
- Feature Engineering
- Model Evaluation
- Python Development
- Flask Web Development
- Data Visualization
- Model Deployment
- Git and GitHub

## 👨‍💻 Author

**Yakshith Anandapu**

B.Tech — Computer Science and Engineering

**Connect With Me**
- GitHub: https://github.com/YAKSHITH684
- LinkedIn: https://www.linkedin.com/in/anandapu-yakshith684/

## ⭐ Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.
