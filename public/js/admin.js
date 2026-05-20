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
        <div class="session-item" style="cursor: pointer;" onclick="viewSessionLogs('${session.id}', '${escapeJS(studentName)}')">
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
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #a78bfa; font-weight: 500;">Click to view logs 🔎</div>
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
        <div class="alert-item" style="border-left: 4px solid ${getSeverityColor(alert.severity)}; cursor: pointer;" onclick="viewSessionLogs('${alert.session_id}', '${escapeJS(student.name)}')">
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
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
            <button class="resolve-btn" onclick="event.stopPropagation(); resolveAlert('${alert.id}')">Resolve</button>
            <span style="font-size: 0.75rem; color: #94a3b8;">Click to view timeline</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Failed to fetch alerts:', error);
  }
}

// View Session logs in detail
async function viewSessionLogs(sessionId, studentName) {
  // Stop polling
  clearInterval(adminPollInterval);

  // Transition UI
  document.getElementById('admin-main-screen').style.display = 'none';
  document.getElementById('admin-logs-screen').style.display = 'block';
  document.getElementById('admin-logs-title').innerText = `🔎 Examinee Activity Logs: ${studentName}`;

  const token = localStorage.getItem('token');
  const tableBody = document.getElementById('admin-logs-table-body');
  tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Fetching activity history...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE}/api/proctor/sessions/${sessionId}/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    const logs = data.data;

    if (!logs || logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #a7f3d0;">No activity logs found for this session. All clear! 🟢</td></tr>`;
      return;
    }

    tableBody.innerHTML = logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const badgeClass = log.is_suspicious ? 'badge-high' : 'badge-low';
      const statusText = log.is_suspicious ? '⚠️ SUSPICIOUS' : '🟢 NORMAL';
      
      return `
        <tr style="border-bottom: 1px solid var(--glass-border); font-size: 0.95rem;">
          <td style="padding: 12px; font-weight: 500;">${timestamp}</td>
          <td style="padding: 12px; text-transform: uppercase; font-weight: 700; color: #a78bfa;">${escapeHTML(log.event_type)}</td>
          <td style="padding: 12px;"><span class="badge ${badgeClass}">${statusText}</span></td>
          <td style="padding: 12px; color: #cbd5e1;">${escapeHTML(log.details || 'N/A')}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #fca5a5;">Error fetching logs: ${error.message}</td></tr>`;
  }
}

// Exit logs details view
function exitLogsView() {
  document.getElementById('admin-logs-screen').style.display = 'none';
  document.getElementById('admin-main-screen').style.display = 'block';
  initAdminDashboard();
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
