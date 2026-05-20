// Admin Dashboard State
let adminPollInterval = null;

// Initialize Admin Dashboard
function initAdminDashboard() {
  document.getElementById('admin-panel').style.display = 'block';
  document.getElementById('student-panel').style.display = 'none';

  // Run initial fetch
  fetchActiveSessions();
  fetchActiveAlerts();

  // Set up polling intervals
  clearInterval(adminPollInterval);
  adminPollInterval = setInterval(() => {
    fetchActiveSessions();
    fetchActiveAlerts();
  }, 4000); // Poll every 4 seconds
}

// Fetch active student exam sessions
async function fetchActiveSessions() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('active-sessions-container');

  try {
    const response = await fetch(`${API_BASE}/api/proctor/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    const sessions = data.data;

    if (!sessions || sessions.length === 0) {
      container.innerHTML = `<div class="empty-state">No student is currently taking an exam.</div>`;
      return;
    }

    container.innerHTML = sessions.map(session => {
      const studentName = session.users ? session.users.name : 'Unknown User';
      const studentEmail = session.users ? session.users.email : '';
      const examTitle = session.exams ? session.exams.title : 'Unknown Exam';
      const startTime = new Date(session.started_at).toLocaleTimeString();

      return `
        <div class="session-item">
          <div>
            <div class="info-header">
              <span class="status-dot active" style="margin-right: 0.5rem; vertical-align: middle;"></span>
              ${escapeHTML(studentName)}
            </div>
            <div class="info-sub">${escapeHTML(studentEmail)}</div>
            <div class="info-sub" style="margin-top: 0.5rem; font-weight: 500; color: #a78bfa;">
              📝 Taking: ${escapeHTML(examTitle)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; font-size: 0.9rem;">Started at ${startTime}</div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Failed to fetch active sessions:', error);
  }
}

// Fetch active unresolved cheating alerts
async function fetchActiveAlerts() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('active-alerts-container');

  try {
    const response = await fetch(`${API_BASE}/api/proctor/alerts`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    const alerts = data.data;

    if (!alerts || alerts.length === 0) {
      container.innerHTML = `<div class="empty-state">No cheating alerts flagged. All clear! 🟢</div>`;
      return;
    }

    container.innerHTML = alerts.map(alert => {
      const session = alert.exam_sessions || {};
      const student = session.users || { name: 'Unknown Student', email: '' };
      const exam = session.exams || { title: 'Unknown Exam' };
      const timestamp = new Date(alert.created_at).toLocaleTimeString();
      const severityClass = `badge-${alert.severity || 'medium'}`;

      return `
        <div class="alert-item" style="border-left: 4px solid ${getSeverityColor(alert.severity)};">
          <div style="flex-grow: 1; margin-right: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <span class="badge ${severityClass}">${escapeHTML(alert.severity)}</span>
              <span style="font-weight: 700; color: #fca5a5;">${escapeHTML(alert.message)}</span>
            </div>
            <div class="info-sub">
              <strong>Student:</strong> ${escapeHTML(student.name)} (${escapeHTML(student.email)})
            </div>
            <div class="info-sub">
              <strong>Exam:</strong> ${escapeHTML(exam.title)} | <strong>Time:</strong> ${timestamp}
            </div>
          </div>
          <div>
            <button class="resolve-btn" onclick="resolveAlert('${alert.id}')">Resolve</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Failed to fetch alerts:', error);
  }
}

// Resolve cheating alert
async function resolveAlert(alertId) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE}/api/proctor/alerts/${alertId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to resolve alert.');
    }

    // Refresh list immediately
    fetchActiveAlerts();
  } catch (error) {
    alert(`Error resolving alert: ${error.message}`);
  }
}

// Create Exam form handler
async function handleCreateExam(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');
  const title = document.getElementById('exam-title').value;
  const description = document.getElementById('exam-desc').value;
  const duration = document.getElementById('exam-duration').value;

  try {
    const response = await fetch(`${API_BASE}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, duration })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create exam.');
    }

    alert('Exam created successfully!');
    closeCreateExamModal();
    document.getElementById('create-exam-form').reset();
  } catch (error) {
    alert(`Failed to create exam: ${error.message}`);
  }
}

// Modal Toggle helpers
function openCreateExamModal() {
  document.getElementById('create-exam-modal').style.display = 'flex';
}

function closeCreateExamModal() {
  document.getElementById('create-exam-modal').style.display = 'none';
}

// Helper to style alert severity left-border
function getSeverityColor(severity) {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#9ca3af';
  }
}

// Disable polling when leaving dashboard page
window.addEventListener('beforeunload', () => {
  clearInterval(adminPollInterval);
});
