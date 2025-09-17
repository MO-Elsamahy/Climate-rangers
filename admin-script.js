// Admin Dashboard JavaScript

// Global variables
let applications = [];
let filteredApplications = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentView = 'table';
let selectedApplication = null;
let statusUpdateData = null;

// Topic mapping
const topicsMap = {
    1: "Introduction to Climate Diplomacy",
    2: "Global Climate Governance", 
    3: "National & Regional Climate Policies",
    4: "Climate Negotiation Strategies",
    5: "Climate Finance"
};

// Organization type mapping
const orgTypeMap = {
    'ngo': 'NGO',
    'igo': 'IGO', 
    'governmental': 'Governmental',
    'private': 'Private Sector',
    'university': 'University'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!window.supabaseUtils || !window.supabaseUtils.isAdminLoggedIn()) {
        window.location.href = 'admin-login.html';
        return;
    }

    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Display admin info
        displayAdminInfo();
        
        // Load initial data
        await loadApplications();
        
        // Initialize event listeners
        initializeEventListeners();
        
        showNotification('Dashboard loaded successfully', 'success');
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

function displayAdminInfo() {
    const adminData = window.supabaseUtils.getAdminData();
    if (adminData) {
        document.getElementById('adminEmail').textContent = adminData.email;
    }
}

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Filter functionality
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('topicFilter').addEventListener('change', handleFilter);
    document.getElementById('orgTypeFilter').addEventListener('change', handleFilter);
    
    // View toggle
    document.getElementById('tableViewBtn').addEventListener('click', () => toggleView('table'));
    document.getElementById('cardsViewBtn').addEventListener('click', () => toggleView('cards'));
    
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeApplicationModal();
            closeStatusModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeApplicationModal();
            closeStatusModal();
        }
    });
}

// Data Loading
async function loadApplications() {
    try {
        showLoadingState();
        
        const result = await window.supabaseUtils.getApplications();
        
        if (result.success) {
            applications = result.data;
            filteredApplications = [...applications];
            
            updateStatistics();
            renderApplications();
            updatePagination();
            
            hideLoadingState();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Failed to load applications', 'error');
        hideLoadingState();
        showEmptyState();
    }
}

async function refreshData() {
    showNotification('Refreshing data...', 'info');
    await loadApplications();
    showNotification('Data refreshed successfully', 'success');
}

// Statistics
function updateStatistics() {
    const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        reviewing: applications.filter(app => app.status === 'reviewing').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length
    };
    
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('reviewingCount').textContent = stats.reviewing;
    document.getElementById('approvedCount').textContent = stats.approved;
}

// Search and Filter
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

function handleFilter() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    applyFilters(searchTerm);
}

function applyFilters(searchTerm = '') {
    const statusFilter = document.getElementById('statusFilter').value;
    const topicFilter = document.getElementById('topicFilter').value;
    const orgTypeFilter = document.getElementById('orgTypeFilter').value;
    
    filteredApplications = applications.filter(app => {
        // Search filter
        const matchesSearch = !searchTerm || 
            app.full_name.toLowerCase().includes(searchTerm) ||
            app.email.toLowerCase().includes(searchTerm) ||
            app.organization.toLowerCase().includes(searchTerm) ||
            app.application_id.toLowerCase().includes(searchTerm);
        
        // Status filter
        const matchesStatus = !statusFilter || app.status === statusFilter;
        
        // Topic filter
        const matchesTopic = !topicFilter || app.selected_topic.toString() === topicFilter;
        
        // Organization type filter
        const matchesOrgType = !orgTypeFilter || app.organization_type === orgTypeFilter;
        
        return matchesSearch && matchesStatus && matchesTopic && matchesOrgType;
    });
    
    currentPage = 1;
    renderApplications();
    updatePagination();
}

// View Toggle
function toggleView(view) {
    currentView = view;
    
    const tableView = document.getElementById('tableView');
    const cardsView = document.getElementById('cardsView');
    const tableBtn = document.getElementById('tableViewBtn');
    const cardsBtn = document.getElementById('cardsViewBtn');
    
    if (view === 'table') {
        tableView.style.display = 'block';
        cardsView.style.display = 'none';
        tableBtn.classList.remove('btn-outline');
        cardsBtn.classList.add('btn-outline');
    } else {
        tableView.style.display = 'none';
        cardsView.style.display = 'block';
        tableBtn.classList.add('btn-outline');
        cardsBtn.classList.remove('btn-outline');
    }
    
    renderApplications();
}

// Rendering
function renderApplications() {
    if (filteredApplications.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    if (currentView === 'table') {
        renderTableView();
    } else {
        renderCardsView();
    }
}

function renderTableView() {
    const tbody = document.getElementById('applicationsTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageApplications = filteredApplications.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageApplications.map(app => `
        <tr onclick="viewApplication('${app.id}')">
            <td>
                <code class="application-id">${app.application_id}</code>
            </td>
            <td>
                <div class="applicant-info">
                    <div class="applicant-name">${app.full_name}</div>
                </div>
            </td>
            <td>${app.email}</td>
            <td>
                <div class="org-info">
                    <div class="org-name">${app.organization}</div>
                    <div class="org-type">${orgTypeMap[app.organization_type] || app.organization_type}</div>
                </div>
            </td>
            <td>${topicsMap[app.selected_topic] || `Topic ${app.selected_topic}`}</td>
            <td><code>${app.selected_module}</code></td>
            <td>
                <span class="status-badge ${app.status}">${app.status}</span>
            </td>
            <td>${formatDate(app.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewApplication('${app.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); quickStatusUpdate('${app.id}', 'approved')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); quickStatusUpdate('${app.id}', 'rejected')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderCardsView() {
    const container = document.getElementById('applicationsCardsContainer');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageApplications = filteredApplications.slice(startIndex, endIndex);
    
    container.innerHTML = pageApplications.map(app => `
        <div class="application-card" onclick="viewApplication('${app.id}')">
            <div class="card-header">
                <div>
                    <div class="card-title">${app.full_name}</div>
                    <div class="card-subtitle">${app.application_id}</div>
                </div>
                <span class="status-badge ${app.status}">${app.status}</span>
            </div>
            
            <div class="card-info">
                <div class="card-info-item">
                    <span class="card-info-label">Email:</span>
                    <span class="card-info-value">${app.email}</span>
                </div>
                <div class="card-info-item">
                    <span class="card-info-label">Organization:</span>
                    <span class="card-info-value">${app.organization}</span>
                </div>
                <div class="card-info-item">
                    <span class="card-info-label">Type:</span>
                    <span class="card-info-value">${orgTypeMap[app.organization_type] || app.organization_type}</span>
                </div>
                <div class="card-info-item">
                    <span class="card-info-label">Topic:</span>
                    <span class="card-info-value">${topicsMap[app.selected_topic]} (${app.selected_module})</span>
                </div>
                <div class="card-info-item">
                    <span class="card-info-label">Applied:</span>
                    <span class="card-info-value">${formatDate(app.created_at)}</span>
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewApplication('${app.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); quickStatusUpdate('${app.id}', 'approved')">
                    <i class="fas fa-check"></i>
                    Approve
                </button>
            </div>
        </div>
    `).join('');
}

// Pagination
function updatePagination() {
    const totalItems = filteredApplications.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    // Update pagination info
    document.getElementById('paginationInfo').textContent = 
        `Showing ${startItem}-${endItem} of ${totalItems} applications`;
    
    // Update pagination controls
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Update page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = generatePageNumbers(currentPage, totalPages);
}

function generatePageNumbers(current, total) {
    if (total <= 1) return '';
    
    let pages = [];
    const maxVisible = 5;
    
    if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        if (current <= 3) {
            pages = [1, 2, 3, 4, '...', total];
        } else if (current >= total - 2) {
            pages = [1, '...', total - 3, total - 2, total - 1, total];
        } else {
            pages = [1, '...', current - 1, current, current + 1, '...', total];
        }
    }
    
    return pages.map(page => {
        if (page === '...') {
            return '<span class="page-ellipsis">...</span>';
        } else {
            const isActive = page === current ? 'active' : '';
            return `<span class="page-number ${isActive}" onclick="goToPage(${page})">${page}</span>`;
        }
    }).join('');
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderApplications();
        updatePagination();
    }
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderApplications();
        updatePagination();
    }
}

// Application Details Modal
async function viewApplication(applicationId) {
    try {
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        
        selectedApplication = application;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = generateApplicationDetails(application);
        
        document.getElementById('applicationModal').classList.add('show');
        
    } catch (error) {
        console.error('Error viewing application:', error);
        showNotification('Failed to load application details', 'error');
    }
}

function generateApplicationDetails(app) {
    return `
        <div class="detail-section">
            <h3>Personal Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Application ID</div>
                    <div class="detail-value"><code>${app.application_id}</code></div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${app.full_name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value"><a href="mailto:${app.email}">${app.email}</a></div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${app.phone}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Organization</div>
                    <div class="detail-value">${app.organization}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Organization Type</div>
                    <div class="detail-value">${orgTypeMap[app.organization_type] || app.organization_type}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Training Selection</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Selected Topic</div>
                    <div class="detail-value">${topicsMap[app.selected_topic] || `Topic ${app.selected_topic}`}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Selected Module</div>
                    <div class="detail-value"><code>${app.selected_module}</code></div>
                </div>
            </div>
            <div class="detail-item" style="margin-top: 1rem;">
                <div class="detail-label">Motivation</div>
                <div class="motivation-text">${app.motivation}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Documents</h3>
            <div class="file-links">
                ${app.cv_url ? `<a href="${app.cv_url}" target="_blank" class="file-link">
                    <i class="fas fa-file-pdf"></i>
                    View CV
                </a>` : '<span class="detail-value">No CV uploaded</span>'}
                ${app.recommendation_letter_url ? `<a href="${app.recommendation_letter_url}" target="_blank" class="file-link">
                    <i class="fas fa-file-signature"></i>
                    View Recommendation Letter
                </a>` : '<span class="detail-value">No recommendation letter uploaded</span>'}
                ${app.logo_url ? `<a href="${app.logo_url}" target="_blank" class="file-link">
                    <i class="fas fa-image"></i>
                    View Organization Logo
                </a>` : '<span class="detail-value">No logo uploaded</span>'}
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Application Status</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Current Status</div>
                    <div class="detail-value"><span class="status-badge ${app.status}">${app.status}</span></div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Submitted</div>
                    <div class="detail-value">${formatDateTime(app.created_at)}</div>
                </div>
                ${app.reviewed_at ? `
                <div class="detail-item">
                    <div class="detail-label">Last Reviewed</div>
                    <div class="detail-value">${formatDateTime(app.reviewed_at)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Reviewed By</div>
                    <div class="detail-value">${app.reviewed_by || 'Unknown'}</div>
                </div>
                ` : ''}
            </div>
            ${app.admin_notes ? `
            <div class="detail-item" style="margin-top: 1rem;">
                <div class="detail-label">Admin Notes</div>
                <div class="motivation-text">${app.admin_notes}</div>
            </div>
            ` : ''}
        </div>
    `;
}

function closeApplicationModal() {
    document.getElementById('applicationModal').classList.remove('show');
    selectedApplication = null;
}

// Status Update
async function updateApplicationStatus(status) {
    if (!selectedApplication) return;
    
    statusUpdateData = {
        applicationId: selectedApplication.id,
        applicationIdText: selectedApplication.application_id,
        applicantName: selectedApplication.full_name,
        newStatus: status
    };
    
    // Update status modal
    document.getElementById('statusAppId').textContent = statusUpdateData.applicationIdText;
    document.getElementById('statusAppName').textContent = statusUpdateData.applicantName;
    document.getElementById('statusNewStatus').textContent = status;
    document.getElementById('statusNewStatus').className = `status-badge ${status}`;
    document.getElementById('adminNotes').value = '';
    
    // Close application modal and show status modal
    closeApplicationModal();
    document.getElementById('statusModal').classList.add('show');
}

async function quickStatusUpdate(applicationId, status) {
    try {
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        
        const result = await window.supabaseUtils.updateApplicationStatus(
            applicationId, 
            status, 
            `Quick ${status} action by admin`
        );
        
        if (result.success) {
            // Update local data
            const appIndex = applications.findIndex(app => app.id === applicationId);
            if (appIndex !== -1) {
                applications[appIndex] = { ...applications[appIndex], ...result.data };
            }
            
            // Refresh display
            applyFilters();
            updateStatistics();
            
            showNotification(`Application ${status} successfully`, 'success');
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        showNotification('Failed to update application status', 'error');
    }
}

async function confirmStatusUpdate() {
    if (!statusUpdateData) return;
    
    try {
        const adminNotes = document.getElementById('adminNotes').value.trim();
        
        const result = await window.supabaseUtils.updateApplicationStatus(
            statusUpdateData.applicationId,
            statusUpdateData.newStatus,
            adminNotes
        );
        
        if (result.success) {
            // Update local data
            const appIndex = applications.findIndex(app => app.id === statusUpdateData.applicationId);
            if (appIndex !== -1) {
                applications[appIndex] = { ...applications[appIndex], ...result.data };
            }
            
            // Refresh display
            applyFilters();
            updateStatistics();
            
            closeStatusModal();
            showNotification(`Application ${statusUpdateData.newStatus} successfully`, 'success');
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        showNotification('Failed to update application status', 'error');
    }
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('show');
    statusUpdateData = null;
}

// Export functionality
function exportData() {
    try {
        const csvData = generateCSV(filteredApplications);
        downloadCSV(csvData, 'climate-rangers-applications.csv');
        showNotification('Applications exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export applications', 'error');
    }
}

function generateCSV(data) {
    const headers = [
        'Application ID', 'Full Name', 'Email', 'Phone', 'Organization', 
        'Organization Type', 'Selected Topic', 'Selected Module', 'Motivation',
        'Status', 'Created At', 'Reviewed At', 'Reviewed By', 'Admin Notes'
    ];
    
    const rows = data.map(app => [
        app.application_id,
        app.full_name,
        app.email,
        app.phone,
        app.organization,
        orgTypeMap[app.organization_type] || app.organization_type,
        topicsMap[app.selected_topic] || `Topic ${app.selected_topic}`,
        app.selected_module,
        `"${app.motivation.replace(/"/g, '""')}"`,
        app.status,
        formatDateTime(app.created_at),
        app.reviewed_at ? formatDateTime(app.reviewed_at) : '',
        app.reviewed_by || '',
        app.admin_notes ? `"${app.admin_notes.replace(/"/g, '""')}"` : ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// UI State Management
function showLoadingState() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('cardsView').style.display = 'none';
    document.getElementById('paginationContainer').style.display = 'none';
}

function hideLoadingState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('paginationContainer').style.display = 'flex';
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('cardsView').style.display = 'none';
    document.getElementById('paginationContainer').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
}

// Notification System
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    
    // Remove existing notifications
    const existingNotifications = container.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to DOM
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for additional styling
const additionalCSS = `
    .application-id {
        background: var(--gray-100);
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-family: monospace;
    }
    
    .applicant-name {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .org-name {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .org-type {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        font-weight: 500;
    }
    
    .table-actions {
        display: flex;
        gap: 0.25rem;
    }
    
    .page-ellipsis {
        padding: 0.5rem;
        color: var(--text-secondary);
    }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
