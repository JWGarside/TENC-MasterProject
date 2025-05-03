// DOM elements
const paperUploadInput = document.getElementById('paper-upload');
const codeUploadInput = document.getElementById('code-upload');
const paperFilename = document.getElementById('paper-filename');
const codeFilename = document.getElementById('code-filename');
const compareButton = document.getElementById('compare-button');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const errorMessage = document.getElementById('error-message');

// File storage
let paperFile = null;
let codeFile = null;

// Event listeners
paperUploadInput.addEventListener('change', handlePaperUpload);
codeUploadInput.addEventListener('change', handleCodeUpload);
compareButton.addEventListener('click', runComparison);

function handlePaperUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        paperFile = file;
        paperFilename.textContent = file.name;
        checkFilesAndEnableButton();
        hideError();
    } else {
        paperFile = null;
        paperFilename.textContent = "Invalid file. Please upload a PDF.";
        showError("Please upload a valid PDF file for the research paper.");
        checkFilesAndEnableButton();
    }
}

function handleCodeUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const validExtensions = ['.py', '.js', '.cpp', '.java', '.r', '.c', '.h', '.ipynb', '.m'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        if (validExtensions.includes(fileExt)) {
            codeFile = file;
            codeFilename.textContent = file.name;
            checkFilesAndEnableButton();
            hideError();
        } else {
            codeFile = null;
            codeFilename.textContent = "Invalid file. Please upload a supported code file.";
            showError("Please upload a valid code file with a supported extension.");
            checkFilesAndEnableButton();
        }
    }
}

function checkFilesAndEnableButton() {
    compareButton.disabled = !(paperFile && codeFile);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    if (paperFile && codeFile) {
        errorMessage.style.display = 'none';
    }
}

async function runComparison() {
    // Reset previous results
    resultsContent.textContent = '';
    resultsSection.style.display = 'none';
    
    // Show loading indicator
    loadingSection.style.display = 'block';
    
    try {
        // Create FormData object to send files
        const formData = new FormData();
        formData.append('paper', paperFile);
        formData.append('code', codeFile);
        
        // Send files to the backend API
        const response = await fetch('/api/compare', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Hide loading indicator
        loadingSection.style.display = 'none';
        
        // Display results
        resultsContent.innerHTML = formatResults(result.analysis);
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error during comparison:', error);
        loadingSection.style.display = 'none';
        showError(`Error during analysis: ${error.message}`);
    }
}

function formatResults(results) {
    // First, check if we have the "NO MAJOR DISCREPANCIES" case
    if (results.includes('NO MAJOR DISCREPANCIES FOUND')) {
        return `
            <div class="success-message">
                <h2>✅ NO MAJOR DISCREPANCIES FOUND</h2>
                <p>${results.split('NO MAJOR DISCREPANCIES FOUND')[1].trim()}</p>
            </div>
        `;
    }

    // Process markdown to HTML with more extensive formatting
    return results
        // Convert headers
        .replace(/## (\d+)\. (.*)/g, '<div class="discrepancy-item"><h2 class="discrepancy-title">$1. $2</h2>')
        .replace(/## (.*)/g, '<div class="discrepancy-item"><h2 class="discrepancy-title">$1</h2>')
        
        // Convert bold sections to labeled sections
        .replace(/\*\*Paper Section:\*\*/g, '<div class="section-label paper-section">Paper Section:</div>')
        .replace(/\*\*Code Location:\*\*/g, '<div class="section-label code-location">Code Location:</div>')
        .replace(/\*\*Impact:\*\*/g, '<div class="section-label impact">Impact:</div>')
        
        // Convert other bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Convert italics
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Convert code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        
        // Convert inline code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        
        // Add section dividers
        .replace(/- <div class="section-label/g, '</div><div class="section"><div class="section-label')
        
        // Close all divs at the end
        + '</div></div>';
}