# **CodeMaster**


## 🚀 Introduction

**CodeMaster** is a revolutionary AI-powered interview platform designed to transform the hiring process with security, fairness, and innovation. Our mission is to redefine technical recruitment through advanced AI algorithms, robust security measures, and seamless code execution integration via Judge0. CodeMaster combines cutting-edge technology with intuitive design to provide an unparalleled experience for both recruiters and candidates.

## ✨ Key Features

### 5-Round Hiring Framework

CodeMaster implements a comprehensive hiring pipeline designed to evaluate candidates from multiple perspectives:

| Round | Status | Description |
|-------|--------|-------------|
| **Resume Round** | Planned | AI-driven resume analysis and candidate shortlisting |
| **Technical Screening** | In Development | Automated skill assessment with adaptive difficulty |
| **HR Round** | Planned | Virtual HR interviews with sentiment analysis |
| **Behavioral Round** | In Development | Scenario-based assessments with AI evaluation |
| **Interview Round** | ✅ Live | Full-featured technical interviews with anti-cheating and code execution |

![home_page](./assets/home.png)
![all_round](./assets/all_round.png)
![face_monitoring](./assets/face_detection.png)
![Code_editor](./assets/editor.png)

### Advanced Anti-Cheating System

Our state-of-the-art proctoring system ensures interview integrity through:

- **Real-time Head & Eye Tracking**: Leveraging MediaPipe and DeepFace for precise facial analysis
- **Continuous Frame Analysis**: Processing video streams to detect suspicious behaviors
- **Multi-level Suspicion Classification**:
  - Low: Minor deviations from expected behavior
  - Medium: Repeated patterns of concern
  - High: Clear indicators of potential misconduct
  - Critical: Strong evidence of cheating attempts
- **Behavioral Logging**: Timestamped record of all detected activities
- **Cheating Probability Score**: Real-time assessment on a scale of 0-1

### Real-Time Monitoring Dashboard

Empower proctors with comprehensive oversight capabilities:

- **Live Video Feed**: Direct view of candidate with face detection overlays
- **Color-coded Indicators**: Visual representation of suspicion levels
  - 🟢 Green: Normal behavior
  - 🟡 Yellow: Potential concerns
  - 🔴 Red: High suspicion activity
- **Automated Warnings**: System-generated alerts for suspicious activities
- **Post-Session Analytics**:
  - Attention score throughout the interview
  - Looking-away percentage and frequency
  - Detailed behavior logs with timestamps
  - Identity verification confidence scores

### Code Execution with Judge0

Secure, sandboxed environment for real-time code assessment:

- **Multi-language Support**: Execute code in Python, Java, C++, JavaScript, and more
- **Real-time Compilation**: Immediate feedback on syntax and runtime errors
- **Automatic Test Case Evaluation**: Verify solution correctness against predefined test cases
- **Performance Metrics**: Analyze execution time and memory usage
- **Secure Sandboxing**: Isolated execution environment for maximum security

### Futuristic Vision

CodeMaster is built with the future in mind:

- **Scalability**: Designed to handle thousands of concurrent interviews
- **AI-driven Insights**: Planned machine learning models for candidate assessment
- **Cross-platform Support**: Currently web-based with mobile apps in development
- **API Extensibility**: Integration capabilities with existing HR systems
- **Continuous Innovation**: Regular updates with cutting-edge features

## 🛠️ Tech Stack

### Frontend
- **Next.js**: React framework for server-side rendering
- **React**: Component-based UI development
- **Tailwind CSS**: Utility-first styling framework
- **Framer Motion**: Advanced animations for enhanced UX

### Backend
- **FastAPI**: High-performance Python web framework
- **OpenCV**: Computer vision for video processing
- **MediaPipe**: ML solution for face and eye tracking
- **DeepFace**: Deep learning for facial recognition and analysis

### Code Execution
- **Judge0**: Secure, sandboxed code compilation and execution

### Real-Time Processing
- **WebRTC**: Low-latency video streaming and communication

### Deployment
- **Docker**: Containerization for all components, including Judge0

## 🏁 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.8+ | Backend development |
| Node.js | 16+ | Frontend development |
| Docker | Latest | Containerization & Judge0 setup |
| Docker Compose | Latest | Multi-container orchestration |
| Webcam | Any | Video capture for monitoring |

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/kumar-ankit-100/codemaster.git
cd codemaster
```

#### 2. Set up the backend
```bash
cd Face_monitoring_Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 3. Set up the frontend
```bash
cd ../coding-platform
npm install
```

#### 4. Install and configure Judge0
```bash
cd ../judge0-setup
docker-compose -f docker-compose.yml up -d
```

Verify Judge0 API availability:
```bash
curl http://localhost:2358/about
```

#### 5. Configure environment variables

Create `.env` files in both backend and frontend directories:

Backend `.env`:
```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost/codemaster
CORS_ORIGINS=http://localhost:3000
JUDGE0_API_URL=http://localhost:2358
CAPTURE_INTERVAL=2.5
```

Frontend `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_JUDGE0_API_URL=http://localhost:2358
```

### Configuration

1. **Backend Settings**: Adjust monitoring sensitivity, capture intervals, and suspicion thresholds in `backend/config.py`
2. **CORS Configuration**: Modify allowed origins in `backend/app.py` for production environments
3. **Judge0 Setup**: Configure language support and resource limits in `judge0-setup/config/judge0-api.conf`

## 📋 Usage

### Face Registration

1. Login to the platform as a candidate
2. Navigate to the "Interview Preparation" section
3. Click "Register Face" to capture your reference image
4. Ensure proper lighting and follow the on-screen positioning guide
5. Confirm your identity image when prompted

### Starting Monitoring

1. Enter the interview session when scheduled
2. Grant camera permissions when prompted
3. Complete the identity verification process
4. Click "Start Monitoring" to begin the anti-cheating analysis
5. Keep your face visible within the frame throughout the interview

### Conducting Coding Interviews

1. Read the problem statement and requirements carefully
2. Select your preferred programming language from the dropdown
3. Write your solution in the code editor provided
4. Use the "Test" button to verify your code against sample test cases
5. Click "Submit" when ready to have your solution evaluated by Judge0
6. Review compilation results, test outcomes, and performance metrics
7. Continue to the next problem or end the session as instructed

### Post-Interview Analysis

1. Interviewers/proctors can access the dashboard after the session
2. Review attention scores and cheating probability trends
3. Analyze behavior logs for suspicious activities
4. Examine code performance metrics and solution quality
5. Generate comprehensive reports for hiring decisions

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### Judge0 Integration Tests
Test Judge0 connectivity and functionality:
```bash
curl -X POST \
  http://localhost:2358/submissions \
  -H 'Content-Type: application/json' \
  -d '{
    "source_code": "print(\"Hello, Judge0!\")",
    "language_id": 71,
    "stdin": ""
  }'
```

### End-to-End Testing
```bash
cd e2e-tests
npm install
npm run test:e2e
```

## 🌟 Why CodeMaster?

- **Uncompromising Security**: Multi-layered protection against cheating and fraud
- **Intuitive Interface**: Seamless experience for both candidates and recruiters
- **Scalable Code Execution**: Reliable assessment through Judge0 integration
- **Data-Driven Insights**: Comprehensive analytics for informed hiring decisions
- **Future-Ready**: Continuously evolving with cutting-edge AI capabilities

## 🗺️ Roadmap

- **Q2 2025**: Complete Technical Screening round integration
- **Q3 2025**: Launch Behavioral Assessment module
- **Q4 2025**: Release mobile applications for iOS and Android
- **Q1 2026**: Implement AI-based candidate scoring
- **Q2 2026**: Deploy predictive analytics for hiring success metrics
- **Q3 2026**: Integrate with major ATS and HR management systems

## 👥 Contributing

We welcome contributions to the CodeMaster project! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🔧 Troubleshooting

### Common Issues

#### Webcam Access
- **Issue**: Browser cannot access webcam
- **Solution**: Ensure camera permissions are granted in browser settings. Try using Chrome or Edge if Firefox encounters issues.

#### API Connection Errors
- **Issue**: Frontend cannot connect to backend API
- **Solution**: Verify backend server is running and CORS settings are properly configured. Check network tab in browser dev tools for specific errors.

#### Judge0 Setup Failures
- **Issue**: Judge0 container fails to start
- **Solution**: Ensure Docker is properly installed and ports 2358-2363 are available. Check Docker logs for specific error messages.

#### Authentication Problems
- **Issue**: Users cannot log in or sessions expire unexpectedly
- **Solution**: Clear browser cookies and cache, verify account credentials, and check backend authentication logs.

## 📬 Contact

- **Issues**: Please report bugs via [GitHub Issues](https://github.com/yourusername/codemaster/issues)
- **Email**: kumar.ankitr0321@gmail.com
