/**
 * File Uploader
 * Drag & drop file upload with progress tracking
 */

import { validateInvoiceFile, validateSpreadsheetFile } from '../utils/validation.js';
import { formatFileSize } from '../utils/formatters.js';
import { generateId } from '../utils/helpers.js';

/**
 * FileUploader class
 */
export class FileUploader {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            accept: options.accept || '*/*',
            maxFiles: options.maxFiles || 1,
            validator: options.validator || null,
            onUpload: options.onUpload || null,
            onError: options.onError || null,
            ...options,
        };
        
        this.files = [];
        this.init();
    }

    /**
     * Initialize file uploader
     */
    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render uploader UI
     */
    render() {
        this.container.innerHTML = `
            <div class="file-uploader" data-uploader-id="${generateId()}">
                <input 
                    type="file" 
                    class="file-uploader__input" 
                    accept="${this.options.accept}"
                    ${this.options.maxFiles > 1 ? 'multiple' : ''}
                    data-input
                />
                <div class="file-uploader__dropzone" data-dropzone>
                    <svg class="file-uploader__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <p class="file-uploader__text">
                        <strong>Drop files here</strong> or click to browse
                    </p>
                    <p class="file-uploader__hint">
                        ${this.options.hint || 'Supported formats: PDF, JPG, PNG'}
                    </p>
                </div>
                <div class="file-uploader__files" data-files></div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const dropzone = this.container.querySelector('[data-dropzone]');
        const input = this.container.querySelector('[data-input]');

        // Click to upload
        dropzone.addEventListener('click', () => input.click());

        // File input change
        input.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
            input.value = ''; // Reset input
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('file-uploader__dropzone--active');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('file-uploader__dropzone--active');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('file-uploader__dropzone--active');
            this.handleFiles(Array.from(e.dataTransfer.files));
        });
    }

    /**
     * Handle selected files
     * @param {Array<File>} fileList - Selected files
     */
    async handleFiles(fileList) {
        // Check max files limit
        if (this.files.length + fileList.length > this.options.maxFiles) {
            this.showError(`Maximum ${this.options.maxFiles} file(s) allowed`);
            return;
        }

        for (const file of fileList) {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                continue;
            }

            // Add file
            const fileData = {
                id: generateId(),
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'pending',
                progress: 0,
            };

            this.files.push(fileData);
            this.renderFile(fileData);

            // Upload file
            if (this.options.onUpload) {
                await this.uploadFile(fileData);
            }
        }
    }

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (this.options.validator) {
            return this.options.validator(file);
        }
        return { valid: true, error: null };
    }

    /**
     * Upload file
     * @param {Object} fileData - File data object
     */
    async uploadFile(fileData) {
        try {
            fileData.status = 'uploading';
            this.updateFileStatus(fileData);

            // Call upload callback with progress tracking
            await this.options.onUpload(fileData.file, (progress) => {
                fileData.progress = progress;
                this.updateFileProgress(fileData);
            });

            fileData.status = 'completed';
            fileData.progress = 100;
            this.updateFileStatus(fileData);
        } catch (error) {
            fileData.status = 'failed';
            fileData.error = error.message;
            this.updateFileStatus(fileData);

            if (this.options.onError) {
                this.options.onError(error, fileData);
            }
        }
    }

    /**
     * Render file item
     * @param {Object} fileData - File data
     */
    renderFile(fileData) {
        const filesContainer = this.container.querySelector('[data-files]');
        
        const fileElement = document.createElement('div');
        fileElement.className = 'file-uploader__file';
        fileElement.dataset.fileId = fileData.id;
        fileElement.innerHTML = `
            <div class="file-uploader__file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                </svg>
            </div>
            <div class="file-uploader__file-info">
                <p class="file-uploader__file-name">${fileData.name}</p>
                <p class="file-uploader__file-size">${formatFileSize(fileData.size)}</p>
                <div class="file-uploader__file-progress" data-progress-bar>
                    <div class="file-uploader__file-progress-fill" style="width: 0%"></div>
                </div>
                <p class="file-uploader__file-status" data-status>Pending...</p>
            </div>
            <button class="file-uploader__file-remove" data-remove aria-label="Remove file">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        // Remove button handler
        const removeBtn = fileElement.querySelector('[data-remove]');
        removeBtn.addEventListener('click', () => this.removeFile(fileData.id));

        filesContainer.appendChild(fileElement);
    }

    /**
     * Update file progress
     * @param {Object} fileData - File data
     */
    updateFileProgress(fileData) {
        const fileElement = this.container.querySelector(`[data-file-id="${fileData.id}"]`);
        if (!fileElement) return;

        const progressFill = fileElement.querySelector('.file-uploader__file-progress-fill');
        progressFill.style.width = `${fileData.progress}%`;
    }

    /**
     * Update file status
     * @param {Object} fileData - File data
     */
    updateFileStatus(fileData) {
        const fileElement = this.container.querySelector(`[data-file-id="${fileData.id}"]`);
        if (!fileElement) return;

        const statusElement = fileElement.querySelector('[data-status]');
        const statusMessages = {
            pending: 'Pending...',
            uploading: 'Uploading...',
            completed: 'Completed',
            failed: `Failed: ${fileData.error || 'Unknown error'}`,
        };

        statusElement.textContent = statusMessages[fileData.status];
        fileElement.setAttribute('data-status', fileData.status);
    }

    /**
     * Remove file
     * @param {string} fileId - File ID
     */
    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        
        const fileElement = this.container.querySelector(`[data-file-id="${fileId}"]`);
        if (fileElement) {
            fileElement.remove();
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const event = new CustomEvent('app:notification', {
            detail: { message, type: 'error' },
            bubbles: true,
        });
        document.dispatchEvent(event);
    }

    /**
     * Get uploaded files
     * @returns {Array} Uploaded files
     */
    getFiles() {
        return this.files.filter(f => f.status === 'completed');
    }

    /**
     * Clear all files
     */
    clear() {
        this.files = [];
        const filesContainer = this.container.querySelector('[data-files]');
        filesContainer.innerHTML = '';
    }

    /**
     * Destroy uploader
     */
    destroy() {
        this.container.innerHTML = '';
        this.files = [];
    }
}

export default FileUploader;
