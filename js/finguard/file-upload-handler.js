/**
 * Adani Fintell Suite - FinGuard
 * File Upload Handler
 * Simple, reliable file upload functionality
 */

'use strict';

console.log('=== File upload handler script loaded ===');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, setting up file upload...');
    
    // Wait a bit to ensure everything is loaded
    setTimeout(function() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('[data-upload-area]');
        const filePreview = document.querySelector('[data-file-preview]');
        const fileName = document.querySelector('[data-file-name]');
        const fileSize = document.querySelector('[data-file-size]');
        const submitBtn = document.querySelector('[data-action="process-file"]');
        const removeBtn = document.querySelector('[data-action="remove-file"]');
        
        console.log('Elements found:', {
            fileInput: !!fileInput,
            uploadArea: !!uploadArea,
            filePreview: !!filePreview,
            submitBtn: !!submitBtn
        });
        
        if (!fileInput) {
            console.error('File input not found!');
            return;
        }
        
        // File input change handler
        fileInput.addEventListener('change', function(e) {
            console.log('File input changed!');
            const files = this.files;
            console.log('Files:', files);
            
            if (files.length > 0) {
                const file = files[0];
                console.log('File selected:', file.name, file.type, file.size);
                
                // Validate file type
                const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Please select a valid file type (PDF, PNG, or JPEG)');
                    return;
                }
                
                // Validate file size (max 50MB)
                const maxSize = 50 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('File size must be less than 50MB');
                    return;
                }
                
                // Store file in a global variable for later access
                window.selectedInvoiceFile = file;
                
                // Update UI
                if (fileName) fileName.textContent = file.name;
                if (fileSize) {
                    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                    fileSize.textContent = sizeInMB + ' MB';
                }
                if (filePreview) filePreview.style.display = 'block';
                if (uploadArea) uploadArea.style.display = 'none';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    console.log('Submit button enabled!');
                }
                
                console.log('File upload UI updated successfully');
            }
        });
        
        // Remove file handler
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                console.log('Remove file clicked');
                fileInput.value = '';
                window.selectedInvoiceFile = null;
                if (filePreview) filePreview.style.display = 'none';
                // Remove inline style to let CSS take over
                if (uploadArea) uploadArea.removeAttribute('style');
                if (submitBtn) submitBtn.disabled = true;
            });
        }
        
        console.log('File upload handlers set up successfully');
        console.log('Note: Process button click handler is managed by process-handler.js');
    }, 500);
});
