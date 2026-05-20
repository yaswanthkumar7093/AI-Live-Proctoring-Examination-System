// Proctoring State variables
let webcamStream = null;
let blazefaceModel = null;
let proctorInterval = null;
let activeSession = null;
let activeExam = null;
let currentQuestionIndex = 0;
let examTimerInterval = null;
let examTimeRemaining = 0; // in seconds

// Mock Quiz Questions Database
const mockQuestions = [
  {
    question: "What is the primary purpose of client-side AI proctoring?",
    options: [
      "To mine cryptocurrency using student devices",
      "To run lightweight face models locally and prevent server bandwidth saturation",
      "To store raw student video recordings permanently on public databases",
      "To automatically answer exam questions for students"
    ],
    answer: 1
  },
  {
    question: "Which web API is used to request access to the student's camera stream?",
    options: [
      "navigator.mediaDevices.getUserMedia()",
      "navigator.camera.capture()",
      "window.requestWebcamStream()",
      "document.getMediaStream()"
    ],
    answer: 0
  },
  {
    question: "How does the system detect if a student opens a new browser tab during an exam?",
    options: [
      "By using desktop screen capture software",
      "By listening to the window 'blur' or document 'visibilitychange' events",
      "By installing browser extensions with system access",
      "By looking at the student's eyes through the webcam"
    ],
    answer: 1
  },
  {
    question: "What does RLS (Row-Level Security) accomplish in Supabase?",
    options: [
      "It encrypts all passwords in the database",
      "It restricts read/write access to specific table rows based on user authentication",
      "It speeds up query lookups by building B-tree indexes",
      "It automatically runs backups of PostgreSQL tables"
    ],
    answer: 1
  },
  {
    question: "Why are serverless functions (like Vercel) not suitable for hosting Socket.io servers?",
    options: [
      "Because serverless code doesn't support Javascript",
      "Because functions are stateless and terminate shortly after executing, closing TCP sockets",
      "Because Vercel bans all WebSocket connections globally",
      "Because WebSockets require relational databases to execute"
    ],
    answer: 1
  }
];

// Initialize Student Dashboard
async function initStudentDashboard() {
  document.getElementById('student-panel').style.display = 'block';
  document.getElementById('student-exams-screen').style.display = 'block';
  document.getElementById('student-active-exam-screen').style.display = 'none';
  await fetchExams();
}

// Fetch all exams from API
async function fetchExams() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('exams-list-container');

  try {
    const response = await fetch(`${API_BASE}/api/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch exams.');
    }

    const exams = data.data;

    if (!exams || exams.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No exams have been created yet by the administrator.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = exams.map(exam => `
      <div class="exam-card glass-panel">
        <h3>${escapeHTML(exam.title)}</h3>
        <p>${escapeHTML(exam.description || 'No description provided.')}</p>
        <div class="exam-meta">
          <div class="meta-item">⏱️ ${exam.duration} Min</div>
          <div class="meta-item">❓ 5 Questions</div>
        </div>
        <button class="btn btn-primary" onclick="confirmStartExam('${exam.id}', '${escapeJS(exam.title)}', ${exam.duration})">
          Start Examination
        </button>
      </div>
    `).join('');

  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Error loading exams: ${error.message}</div>`;
  }
}

// Show start exam prompt and request webcam permission
async function confirmStartExam(examId, examTitle, durationMinutes) {
  if (!confirm(`Are you ready to start "${examTitle}"? This will activate your camera for AI Proctoring.`)) {
    return;
  }

  // Pre-fetch model to ensure it is ready
  const statusIndicator = document.getElementById('ai-status-indicator');
  const statusText = document.getElementById('ai-status-text');

  // Transition UI
  document.getElementById('student-exams-screen').style.display = 'none';
  document.getElementById('student-active-exam-screen').style.display = 'block';
  document.getElementById('active-exam-title').innerText = examTitle;

  // Initialize Quiz variables
  currentQuestionIndex = 0;
  activeExam = { id: examId, title: examTitle, duration: durationMinutes };

  // Turn on camera checking and load BlazeFace model
  try {
    updateAIStatus('starting', 'Loading AI...');
    await initWebcam();
    await loadAIModel();
    await createExamSession(examId);

    // Start exam details
    examTimeRemaining = durationMinutes * 60;
    startExamTimer();
    renderQuestion();

    // Start loop for AI Face Detection
    startProctoringLoop();
    bindVisibilityEvents();

  } catch (error) {
    alert(`Could not start exam: ${error.message}`);
    stopProctoring();
    initStudentDashboard();
  }
}

// Request webcam access
async function initWebcam() {
  const video = document.getElementById('webcam');
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });
    video.srcObject = webcamStream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (err) {
    throw new Error('Camera access is required for AI Proctoring. Please grant permission.');
  }
}

// Load BlazeFace Model
async function loadAIModel() {
  try {
    blazefaceModel = await blazeface.load();
  } catch (err) {
    throw new Error('Failed to load TensorFlow.js BlazeFace model.');
  }
}

// Create active exam session in DB
async function createExamSession(examId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/api/exams/${examId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initialize exam session.');
  }

  activeSession = data.data;
}

// Submit Proctor Log/Alert to API
async function sendProctorLog(eventType, details = '', isSuspicious = false) {
  if (!activeSession) return;
  const token = localStorage.getItem('token');

  try {
    await fetch(`${API_BASE}/api/proctor/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: activeSession.id,
        event_type: eventType,
        details,
        is_suspicious: isSuspicious
      })
    });
  } catch (error) {
    console.error('Failed to report proctor log:', error);
  }
}

// Proctoring AI Tracking loop
let suspiciousFramesCount = 0;
let multiFaceFramesCount = 0;
let cleanFramesCount = 0;

function startProctoringLoop() {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('canvas-overlay');
  const context = canvas.getContext('2d');

  // Match sizes
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  async function track() {
    if (!webcamStream || !blazefaceModel || !activeSession) return;

    try {
      const predictions = await blazefaceModel.estimateFaces(video, false);
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (predictions.length === 0) {
        suspiciousFramesCount++;
        cleanFramesCount = 0;

        if (suspiciousFramesCount >= 10) { // consecutive frames
          updateAIStatus('suspicious', '⚠️ No Face Detected!');
          triggerCheatingAlert('face_missing', 'Examinee face is missing from webcam view.');
          suspiciousFramesCount = 0; // limit spam alerts
        }
      } else if (predictions.length > 1) {
        multiFaceFramesCount++;
        cleanFramesCount = 0;

        if (multiFaceFramesCount >= 5) {
          updateAIStatus('suspicious', '⚠️ Multiple Faces Detected!');
          triggerCheatingAlert('multiple_faces', `Detected ${predictions.length} faces in webcam view.`);
          multiFaceFramesCount = 0;
        }
      } else {
        // Exactly one face detected
        suspiciousFramesCount = 0;
        multiFaceFramesCount = 0;
        cleanFramesCount++;

        if (cleanFramesCount > 5) {
          updateAIStatus('active', '🟢 AI Proctoring Active');
        }

        const prediction = predictions[0];
        const start = prediction.topLeft;
        const end = prediction.bottomRight;
        const size = [end[0] - start[0], end[1] - start[1]];

        // Draw bounding box
        context.strokeStyle = '#10b981';
        context.lineWidth = 3;
        context.strokeRect(start[0], start[1], size[0], size[1]);

        // Simple look-away detection: calculate bounding box center relative to frame center
        const faceCenterX = start[0] + size[0] / 2;
        const frameCenterX = canvas.width / 2;
        const devianceX = Math.abs(faceCenterX - frameCenterX) / canvas.width;

        if (devianceX > 0.25) { // face is too far off-center
          updateAIStatus('suspicious', '⚠️ Looking Away!');
          triggerCheatingAlert('looking_away', 'Student is looking away from the screen.');
        }
      }
    } catch (err) {
      console.error('Detection loop error:', err);
    }

    // Schedule next frame
    proctorInterval = requestAnimationFrame(track);
  }

  // Start recursion
  proctorInterval = requestAnimationFrame(track);
}

// Trigger alert UI and log it
function triggerCheatingAlert(eventType, description) {
  // Flash red UI overlay
  const cameraCard = document.getElementById('camera-card-element');
  if (cameraCard) {
    cameraCard.classList.add('alerting');
    setTimeout(() => cameraCard.classList.remove('alerting'), 1000);
  }

  sendProctorLog(eventType, description, true);
}

// Visibility change (tab switching) listener
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    triggerCheatingAlert('tab_switch', 'Student switched browser tab or minimized window.');
  }
}

function bindVisibilityEvents() {
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

function unbindVisibilityEvents() {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// UI State helpers
function updateAIStatus(state, text) {
  const indicator = document.getElementById('ai-status-indicator');
  const textSpan = document.getElementById('ai-status-text');

  textSpan.innerText = text;

  if (state === 'suspicious') {
    indicator.className = 'detection-status status-suspicious';
  } else if (state === 'active') {
    indicator.className = 'detection-status status-active';
  } else {
    indicator.className = 'detection-status';
  }
}

// Stop webcam streams and tracking threads
function stopProctoring() {
  if (proctorInterval) {
    cancelAnimationFrame(proctorInterval);
    proctorInterval = null;
  }
  unbindVisibilityEvents();

  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }

  clearInterval(examTimerInterval);
  activeSession = null;
}

// Exam Timer Loop
function startExamTimer() {
  const display = document.getElementById('exam-timer-display');
  
  examTimerInterval = setInterval(() => {
    if (examTimeRemaining <= 0) {
      clearInterval(examTimerInterval);
      alert('Time is up! Your examination is being submitted automatically.');
      submitActiveExam();
      return;
    }
    examTimeRemaining--;
    const minutes = Math.floor(examTimeRemaining / 60);
    const seconds = examTimeRemaining % 60;
    display.innerText = `⏱️ Remaining: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// Quiz UI Rendering
function renderQuestion() {
  const question = mockQuestions[currentQuestionIndex];
  document.getElementById('quiz-question-text').innerText = `Question ${currentQuestionIndex + 1} of ${mockQuestions.length}: ${question.question}`;
  
  const optionsBox = document.getElementById('quiz-options-container');
  optionsBox.innerHTML = question.options.map((option, index) => `
    <label class="option-item">
      <input type="radio" name="quiz-option" value="${index}">
      <span>${escapeHTML(option)}</span>
    </label>
  `).join('');

  document.getElementById('prev-question-btn').disabled = (currentQuestionIndex === 0);
  
  const nextBtn = document.getElementById('next-question-btn');
  if (currentQuestionIndex === mockQuestions.length - 1) {
    nextBtn.innerText = 'Submit Quiz Answers';
    nextBtn.onclick = submitActiveExam;
  } else {
    nextBtn.innerText = 'Next Question';
    nextBtn.onclick = nextQuestion;
  }
}

function nextQuestion() {
  if (currentQuestionIndex < mockQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

// Submit Active Exam Session
async function submitActiveExam() {
  if (!activeExam || !activeSession) return;

  const token = localStorage.getItem('token');
  stopProctoring();

  try {
    const response = await fetch(`${API_BASE}/api/exams/${activeExam.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit exam session.');
    }

    alert('Your examination has been completed and submitted successfully.');
    initStudentDashboard();

  } catch (error) {
    alert(`Submission error: ${error.message}`);
    initStudentDashboard();
  }
}

// Utilities
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function escapeJS(str) {
  if (!str) return '';
  return str.replace(/['"\\\n\r\u2028\u2029]/g, char => {
    switch (char) {
      case "'": return "\\'";
      case '"': return '\\"';
      case '\\': return '\\\\';
      case '\n': return '\\n';
      case '\r': return '\\r';
      default: return '';
    }
  });
}

// Exit and go back to exams list
function confirmExitExam() {
  if (confirm("Are you sure you want to exit the exam? Your progress will be lost and this proctoring session will end.")) {
    stopProctoring();
    initStudentDashboard();
  }
}
