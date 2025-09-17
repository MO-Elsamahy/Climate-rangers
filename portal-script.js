// Application Portal JavaScript with Supabase Integration

// Topic and Module Data
const topicsData = {
    1: {
        title: "Introduction to Climate Diplomacy",
        description: "Build foundational knowledge of climate science and diplomacy",
        modules: {
            "1.1": {
                title: "Climate Change Fundamentals",
                description: "Understanding the scientific basis of climate change and its impacts"
            },
            "1.2": {
                title: "Evolution of Global Climate Policy", 
                description: "Tracing the development of international climate policy frameworks"
            },
            "1.3": {
                title: "Key Milestones (Rio, Kyoto, Paris)",
                description: "Analyzing major climate agreements and their significance"
            }
        }
    },
    2: {
        title: "Global Climate Governance",
        description: "Understand international climate institutions and frameworks",
        modules: {
            "2.1": {
                title: "UNFCCC Framework",
                description: "Deep dive into the United Nations Framework Convention on Climate Change"
            },
            "2.2": {
                title: "Multilateral Environmental Agreements",
                description: "Exploring various international environmental treaties and protocols"
            },
            "2.3": {
                title: "Role of IPCC, UNEP, WMO",
                description: "Understanding key international climate organizations and their functions"
            }
        }
    },
    3: {
        title: "National & Regional Climate Policies",
        description: "Analyze national climate actions and regional dynamics",
        modules: {
            "3.1": {
                title: "Nationally Determined Contributions (NDCs)",
                description: "Understanding country commitments under the Paris Agreement"
            },
            "3.2": {
                title: "Regional Cooperation (EU, Africa, MENA)",
                description: "Examining regional climate initiatives and cooperation mechanisms"
            },
            "3.3": {
                title: "Subnational and Local Climate Policies",
                description: "Exploring city and regional climate action and governance"
            }
        }
    },
    4: {
        title: "Climate Negotiation Strategies",
        description: "Master negotiation tactics and coalition building",
        modules: {
            "4.1": {
                title: "Negotiation Theories",
                description: "Fundamental principles and approaches to international negotiation"
            },
            "4.2": {
                title: "Multilateral Dynamics",
                description: "Understanding complex multi-party negotiation processes"
            },
            "4.3": {
                title: "Coalition Politics (G77, AOSIS, BASIC)",
                description: "Analyzing negotiation blocs and alliance strategies"
            }
        }
    },
    5: {
        title: "Climate Finance",
        description: "Understand finance systems and proposal development",
        modules: {
            "5.1": {
                title: "Climate Finance Sources",
                description: "Exploring funding mechanisms and financial institutions"
            },
            "5.2": {
                title: "Economic Instruments",
                description: "Understanding carbon markets, taxes, and economic policy tools"
            },
            "5.3": {
                title: "Proposal Design & Reporting",
                description: "Developing effective climate finance proposals and reporting frameworks"
            }
        }
    }
};

// Application State
let currentStep = 1;
let selectedTopic = null;
let selectedModule = null;
let formData = {};
let uploadedFiles = {};

// DOM Elements
const form = document.getElementById('applicationForm');
const steps = document.querySelectorAll('.step');
const formSteps = document.querySelectorAll('.form-step');
const nextButtons = document.querySelectorAll('.next-step');
const prevButtons = document.querySelectorAll('.prev-step');
const topicCards = document.querySelectorAll('.topic-card');
const moduleSelection = document.getElementById('moduleSelection');
const moduleGrid = document.getElementById('moduleGrid');
const motivationSection = document.getElementById('motivationSection');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateProgressSteps();
    
    // Check if Supabase is loaded
    if (typeof window.supabaseClient === 'undefined') {
        console.error('Supabase not loaded. Please check your configuration.');
        showNotification('System error: Database connection failed', 'error');
    }
});

// Event Listeners
function initializeEventListeners() {
    // Step navigation
    nextButtons.forEach(btn => {
        btn.addEventListener('click', handleNextStep);
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', handlePrevStep);
    });
    
    // Topic selection
    topicCards.forEach(card => {
        card.addEventListener('click', handleTopicSelection);
    });
    
    // Form submission
    form.addEventListener('submit', handleFormSubmission);
    
    // File uploads
    initializeFileUploads();
    
    // Form validation
    initializeFormValidation();
}

// Step Navigation
function handleNextStep(e) {
    e.preventDefault();
    
    if (validateCurrentStep()) {
        if (currentStep < 4) {
            currentStep++;
            updateFormStep();
            updateProgressSteps();
            
            // Special handling for review step
            if (currentStep === 4) {
                populateReviewData();
            }
        }
    }
}

function handlePrevStep(e) {
    e.preventDefault();
    
    if (currentStep > 1) {
        currentStep--;
        updateFormStep();
        updateProgressSteps();
    }
}

function updateFormStep() {
    formSteps.forEach((step, index) => {
        step.classList.toggle('active', index === currentStep - 1);
    });
    
    // Animate step transition
    const activeStep = document.querySelector('.form-step.active');
    if (activeStep) {
        activeStep.style.opacity = '0';
        activeStep.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            activeStep.style.opacity = '1';
            activeStep.style.transform = 'translateX(0)';
        }, 50);
    }
}

function updateProgressSteps() {
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.toggle('active', stepNumber === currentStep);
        step.classList.toggle('completed', stepNumber < currentStep);
    });
}

// Topic Selection
function handleTopicSelection(e) {
    const topicId = parseInt(e.currentTarget.dataset.topic);
    
    // Remove previous selection
    topicCards.forEach(card => card.classList.remove('selected'));
    
    // Add selection to clicked card
    e.currentTarget.classList.add('selected');
    
    // Update selected topic
    selectedTopic = topicId;
    selectedModule = null; // Reset module selection
    
    // Update hidden input
    document.getElementById('selectedTopic').value = topicId;
    document.getElementById('selectedModule').value = '';
    
    // Show module selection
    showModuleSelection(topicId);
    
    // Update next button state
    updateStep2NextButton();
}

function showModuleSelection(topicId) {
    const topic = topicsData[topicId];
    
    // Clear previous modules
    moduleGrid.innerHTML = '';
    
    // Create module cards
    Object.keys(topic.modules).forEach(moduleKey => {
        const module = topic.modules[moduleKey];
        const moduleCard = createModuleCard(moduleKey, module);
        moduleGrid.appendChild(moduleCard);
    });
    
    // Show module selection section
    moduleSelection.style.display = 'block';
    moduleSelection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Hide motivation section initially
    motivationSection.style.display = 'none';
}

function createModuleCard(moduleKey, module) {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.dataset.module = moduleKey;
    
    card.innerHTML = `
        <div class="module-number">${moduleKey}</div>
        <div class="module-content">
            <h4>${module.title}</h4>
            <p>${module.description}</p>
        </div>
    `;
    
    card.addEventListener('click', handleModuleSelection);
    
    return card;
}

function handleModuleSelection(e) {
    const moduleKey = e.currentTarget.dataset.module;
    
    // Remove previous selection
    document.querySelectorAll('.module-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    e.currentTarget.classList.add('selected');
    
    // Update selected module
    selectedModule = moduleKey;
    
    // Update hidden input
    document.getElementById('selectedModule').value = moduleKey;
    
    // Show motivation section
    motivationSection.style.display = 'block';
    motivationSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Update next button state
    updateStep2NextButton();
}

function updateStep2NextButton() {
    const nextBtn = document.querySelector('[data-step="2"] .next-step');
    const motivationText = document.getElementById('motivation').value.trim();
    
    const isValid = selectedTopic && selectedModule && motivationText.length > 0;
    nextBtn.disabled = !isValid;
}

// Form Validation
function initializeFormValidation() {
    // Real-time validation for step 2
    const motivationTextarea = document.getElementById('motivation');
    if (motivationTextarea) {
        motivationTextarea.addEventListener('input', updateStep2NextButton);
    }
    
    // Real-time validation for other inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        case 4:
            return validateStep4();
        default:
            return true;
    }
}

function validateStep1() {
    const requiredFields = ['fullName', 'organization', 'organizationType', 'email', 'phone'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateStep2() {
    const motivationText = document.getElementById('motivation').value.trim();
    
    if (!selectedTopic) {
        showNotification('Please select a topic', 'error');
        return false;
    }
    
    if (!selectedModule) {
        showNotification('Please select a module', 'error');
        return false;
    }
    
    if (motivationText.length < 50) {
        showNotification('Please provide a more detailed explanation (at least 50 characters)', 'error');
        return false;
    }
    
    return true;
}

function validateStep3() {
    const cvFile = document.getElementById('cv').files[0];
    const recommendationFile = document.getElementById('recommendation').files[0];
    
    if (!cvFile) {
        showNotification('Please upload your CV', 'error');
        return false;
    }
    
    if (!recommendationFile) {
        showNotification('Please upload your recommendation letter', 'error');
        return false;
    }
    
    return true;
}

function validateStep4() {
    const termsCheckbox = document.getElementById('terms');
    
    if (!termsCheckbox.checked) {
        showNotification('Please accept the terms and conditions', 'error');
        return false;
    }
    
    return true;
}

function validateField(field) {
    if (!field) return true;
    
    const value = field.value.trim();
    const fieldContainer = field.closest('.form-group');
    const isRequired = field.hasAttribute('required');
    
    // Clear previous errors
    clearFieldError(field);
    
    // Check if required field is empty
    if (isRequired && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    // Phone validation
    if (field.type === 'tel' && value && !isValidPhone(value)) {
        showFieldError(field, 'Please enter a valid phone number');
        return false;
    }
    
    // Success state
    if (value && fieldContainer) {
        fieldContainer.classList.add('success');
    }
    
    return true;
}

function showFieldError(field, message) {
    const fieldContainer = field.closest('.form-group');
    if (!fieldContainer) return;
    
    fieldContainer.classList.add('error');
    fieldContainer.classList.remove('success');
    
    // Remove existing error message
    const existingError = fieldContainer.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    fieldContainer.appendChild(errorElement);
}

function clearFieldError(field) {
    const fieldContainer = field.closest('.form-group');
    if (!fieldContainer) return;
    
    fieldContainer.classList.remove('error');
    
    const errorMessage = fieldContainer.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// File Upload with Supabase
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        const uploadArea = input.closest('.file-upload');
        
        // Click to upload
        uploadArea.addEventListener('click', () => input.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        
        // File selection
        input.addEventListener('change', handleFileSelection);
    });
    
    // Remove file buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-file')) {
            const target = e.target.closest('.remove-file').dataset.target;
            removeFile(target);
        }
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    const input = e.currentTarget.querySelector('input[type="file"]');
    
    if (files.length > 0) {
        input.files = files;
        handleFileSelection({ target: input });
    }
}

function handleFileSelection(e) {
    const input = e.target;
    const file = input.files[0];
    
    if (!file) return;
    
    const fieldName = input.name;
    const maxSize = (fieldName === 'cv' || fieldName === 'recommendation') ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB for documents, 2MB for logo
    
    // Validate file size
    if (file.size > maxSize) {
        showNotification(`File size must be less than ${maxSize / (1024 * 1024)}MB`, 'error');
        input.value = '';
        return;
    }
    
    // Validate file type
    if (!validateFileType(file, fieldName)) {
        const fileTypeDesc = (fieldName === 'cv' || fieldName === 'recommendation') ? 'document' : 'image';
        showNotification(`Invalid file type. Please select a valid ${fileTypeDesc} file.`, 'error');
        input.value = '';
        return;
    }
    
    // Store file
    uploadedFiles[fieldName] = file;
    
    // Show upload progress
    showUploadProgress(fieldName, file);
    
    // Simulate upload progress (actual upload happens on form submission)
    simulateUploadProgress(fieldName, () => {
        showFileInfo(fieldName, file);
    });
}

function validateFileType(file, fieldName) {
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    
    if (fieldName === 'cv' || fieldName === 'recommendation') {
        return documentTypes.includes(file.type);
    } else if (fieldName === 'logo') {
        return imageTypes.includes(file.type);
    }
    
    return false;
}

function showUploadProgress(fieldName, file) {
    const uploadArea = document.querySelector(`#${fieldName}Upload`);
    const uploadContent = uploadArea.querySelector('.upload-content');
    const uploadProgress = uploadArea.querySelector('.upload-progress');
    
    uploadContent.style.display = 'none';
    uploadProgress.style.display = 'block';
}

function simulateUploadProgress(fieldName, callback) {
    const progressBar = document.querySelector(`#${fieldName}Upload .progress-bar`);
    const progressText = document.querySelector(`#${fieldName}Upload .progress-text`);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(callback, 500);
        }
        
        progressBar.style.setProperty('--progress', `${progress}%`);
        progressText.textContent = `${Math.round(progress)}%`;
    }, 100);
}

function showFileInfo(fieldName, file) {
    const uploadArea = document.querySelector(`#${fieldName}Upload`);
    const fileInfo = document.querySelector(`#${fieldName}Info`);
    const fileName = fileInfo.querySelector('.file-name');
    const fileSize = fileInfo.querySelector('.file-size');
    
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
}

function removeFile(fieldName) {
    const input = document.getElementById(fieldName);
    const uploadArea = document.querySelector(`#${fieldName}Upload`);
    const fileInfo = document.querySelector(`#${fieldName}Info`);
    const uploadContent = uploadArea.querySelector('.upload-content');
    const uploadProgress = uploadArea.querySelector('.upload-progress');
    
    // Clear file
    input.value = '';
    delete uploadedFiles[fieldName];
    
    // Reset UI
    uploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    uploadContent.style.display = 'block';
    uploadProgress.style.display = 'none';
    
    showNotification('File removed successfully', 'success');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Review Data Population
function populateReviewData() {
    // Personal Information
    document.getElementById('reviewName').textContent = document.getElementById('fullName').value;
    document.getElementById('reviewOrganization').textContent = document.getElementById('organization').value;
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
    document.getElementById('reviewPhone').textContent = document.getElementById('phone').value;
    
    // Organization Type
    const orgTypeSelect = document.getElementById('organizationType');
    const orgTypeText = orgTypeSelect.options[orgTypeSelect.selectedIndex].text;
    document.getElementById('reviewType').textContent = orgTypeText;
    
    // Selected Training
    if (selectedTopic && selectedModule) {
        const topic = topicsData[selectedTopic];
        const module = topic.modules[selectedModule];
        
        document.getElementById('reviewTopicTitle').textContent = topic.title;
        document.getElementById('reviewTopicDesc').textContent = topic.description;
        document.getElementById('reviewModuleTitle').textContent = `${selectedModule} - ${module.title}`;
        document.getElementById('reviewModuleDesc').textContent = module.description;
    }
    
    // Motivation
    document.getElementById('reviewMotivation').textContent = document.getElementById('motivation').value;
    
    // Files
    if (uploadedFiles.cv) {
        document.getElementById('reviewCVName').textContent = uploadedFiles.cv.name;
    }
    
    if (uploadedFiles.recommendation) {
        document.getElementById('reviewRecommendationName').textContent = uploadedFiles.recommendation.name;
    }
    
    if (uploadedFiles.logo) {
        document.getElementById('reviewLogo').style.display = 'flex';
        document.getElementById('reviewLogoName').textContent = uploadedFiles.logo.name;
    } else {
        document.getElementById('reviewLogo').style.display = 'none';
    }
}

// Form Submission with Supabase
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // Generate application ID
        const applicationId = window.supabaseUtils.generateApplicationId();
        
        // Upload files to Supabase Storage
        let cvUrl = '';
        let recommendationUrl = '';
        let logoUrl = '';
        
        if (uploadedFiles.cv) {
            const cvPath = `${applicationId}/cv/${uploadedFiles.cv.name}`;
            const cvUploadResult = await window.supabaseUtils.uploadFile(uploadedFiles.cv, cvPath);
            
            if (!cvUploadResult.success) {
                throw new Error('Failed to upload CV: ' + cvUploadResult.error);
            }
            
            cvUrl = cvUploadResult.url;
        }
        
        if (uploadedFiles.recommendation) {
            const recommendationPath = `${applicationId}/recommendation/${uploadedFiles.recommendation.name}`;
            const recommendationUploadResult = await window.supabaseUtils.uploadFile(uploadedFiles.recommendation, recommendationPath);
            
            if (!recommendationUploadResult.success) {
                throw new Error('Failed to upload recommendation letter: ' + recommendationUploadResult.error);
            }
            
            recommendationUrl = recommendationUploadResult.url;
        }
        
        if (uploadedFiles.logo) {
            const logoPath = `${applicationId}/logo/${uploadedFiles.logo.name}`;
            const logoUploadResult = await window.supabaseUtils.uploadFile(uploadedFiles.logo, logoPath);
            
            if (!logoUploadResult.success) {
                throw new Error('Failed to upload logo: ' + logoUploadResult.error);
            }
            
            logoUrl = logoUploadResult.url;
        }
        
        // Prepare application data
        const applicationData = {
            application_id: applicationId,
            full_name: document.getElementById('fullName').value.trim(),
            organization: document.getElementById('organization').value.trim(),
            organization_type: document.getElementById('organizationType').value,
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            selected_topic: selectedTopic,
            selected_module: selectedModule,
            motivation: document.getElementById('motivation').value.trim(),
            cv_url: cvUrl,
            recommendation_letter_url: recommendationUrl,
            logo_url: logoUrl,
            status: 'pending'
        };
        
        // Submit to Supabase
        const result = await window.supabaseUtils.submitApplication(applicationData);
        
        if (!result.success) {
            throw new Error('Failed to submit application: ' + result.error);
        }
        
        // Show success notification
        showNotification('Application submitted successfully!', 'success');
        
        // Show success modal
        showSuccessModal(applicationId);
        
        // Clear form data
        localStorage.removeItem('climateRangersApplication');
        
        console.log('Application submitted successfully:', result.data);
        
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification('Failed to submit application. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

function showSuccessModal(applicationId) {
    const modal = document.getElementById('successModal');
    const applicationIdSpan = document.getElementById('applicationId');
    
    applicationIdSpan.textContent = applicationId;
    modal.classList.add('show');
    
    // Store application ID in localStorage
    localStorage.setItem('lastApplicationId', applicationId);
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    
    // Optionally redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
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
    document.body.appendChild(notification);
    
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

// Auto-save functionality
function initializeAutoSave() {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            data.selectedTopic = selectedTopic;
            data.selectedModule = selectedModule;
            localStorage.setItem('climateRangersApplication', JSON.stringify(data));
        }, 1000));
    });
}

// Load saved data on page load
function loadSavedData() {
    const savedData = localStorage.getItem('climateRangersApplication');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                if (key === 'selectedTopic' && data[key]) {
                    selectedTopic = parseInt(data[key]);
                    const topicCard = document.querySelector(`[data-topic="${selectedTopic}"]`);
                    if (topicCard) {
                        topicCard.click();
                    }
                } else if (key === 'selectedModule' && data[key]) {
                    selectedModule = data[key];
                    // Module selection will be handled after topic selection
                } else {
                    const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = data[key];
                    }
                }
            });
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Utility function
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

// Initialize auto-save and load saved data
document.addEventListener('DOMContentLoaded', function() {
    initializeAutoSave();
    loadSavedData();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + Right Arrow: Next step
    if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const nextBtn = document.querySelector('.form-step.active .next-step');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
        }
    }
    
    // Alt + Left Arrow: Previous step
    if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevBtn = document.querySelector('.form-step.active .prev-step');
        if (prevBtn) {
            prevBtn.click();
        }
    }
    
    // Escape: Close modal
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal.show');
        if (modal) {
            closeModal();
        }
    }
});