import { marked } from 'marked';
import DOMPurify from 'dompurify';

class ProjectAnalyzer {
    constructor() {
        this.projectName = document.getElementById('project-name');
        this.projectDescription = document.getElementById('project-description');
        this.analyzeButton = document.getElementById('analyze-project');
        this.analysisResults = document.getElementById('analysis-results');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.currentResponse = '';

        // Cấu hình marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        this.setupEventListeners();
        this.initAutoResize();

        // Add new elements
        this.editButton = document.getElementById('edit-analysis');
        this.askGptButton = document.getElementById('ask-gpt');
        this.editModal = document.getElementById('edit-modal');
        this.gptModal = document.getElementById('gpt-modal');
        this.editContent = document.getElementById('edit-content');
        this.gptInput = document.getElementById('gpt-input');
        this.chatHistory = document.getElementById('chat-history');
        
        this.setupModalEvents();

        this.originalMarkdown = ''; // Lưu trữ markdown gốc
        this.currentEditingSection = null;
        this.fullMarkdownModal = null; // Thêm biến để theo dõi modal
        
        // Thêm các buttons mới
        this.editFullButton = document.getElementById('edit-full-analysis');
        this.editSectionButton = document.getElementById('edit-section');
        
        this.setupEditingFeatures();

        this.projectId = null;
        this.setupProjectListEvents();

        this.originalProjectData = {
            name: '',
            description: ''
        };
        this.setupInputChangeTracking();

        this.setupDeleteProjectEvents();

        this.projectsList = document.getElementById('projects-list'); // Thêm biến để lưu trữ danh sách dự án
    }

    initAutoResize() {
        // Set initial height
        this.autoResizeTextArea(this.projectDescription);
        
        // Add input event listener
        this.projectDescription.addEventListener('input', () => {
            this.autoResizeTextArea(this.projectDescription);
        });
    }

    autoResizeTextArea(element) {
        // Reset height to auto to get the correct scrollHeight
        element.style.height = 'auto';
        // Set new height based on scrollHeight
        element.style.height = element.scrollHeight + 'px';
    }

    setupEventListeners() {
        this.analyzeButton.addEventListener('click', () => this.analyzeProject());
        document.getElementById('save-project')?.addEventListener('click', () => this.updateProjectDetails());
    }

    async analyzeProject() {
        const name = this.projectName.value.trim();
        const description = this.projectDescription.value.trim();
        const model = document.getElementById('model-select').value;

        if (!name || !description) {
            alert('Please enter both project name and description');
            return;
        }

        try {
            this.showLoading();
            this.analyzeButton.disabled = true;

            const response = await fetch('/integraflow/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ name, description, model })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            this.projectId = data.project_id;
            
            const resultsElement = document.getElementById('analysis-results');
            if (resultsElement) {
                resultsElement.setAttribute('data-project-id', this.projectId);
            }

            this.displayResults(data.analysis.raw_content);

            // Tải lại danh sách dự án
            await this.loadProjects();

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred while analyzing the project');
        } finally {
            this.hideLoading();
            this.analyzeButton.disabled = false;
        }
    }

    async saveProject() {
        if (!this.currentResponse || !this.projectName.value || !this.projectDescription.value) {
            alert('Please analyze the project first');
            return;
        }

        try {
            const response = await fetch('/integraflow/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    name: this.projectName.value,
                    description: this.projectDescription.value,
                    analysis_result: this.currentResponse
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Project saved successfully');
                // Show save button after successful analysis
                document.getElementById('save-project').classList.remove('hidden');
            } else {
                throw new Error(data.error || 'Failed to save project');
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred while saving the project');
        }
    }

    displayResults(content) {
        this.originalMarkdown = content;
        const htmlContent = DOMPurify.sanitize(marked.parse(content));
        
        // Xóa buttons container cũ nếu tồn tại
        const existingButtons = document.querySelector('.action-buttons');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        // Tạo container cho buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'action-buttons';
        buttonsContainer.innerHTML = `
            <button id="view-markdown" 
                    class="action-button bg-blue-600 hover:bg-blue-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                View/Edit Markdown
            </button>
            <button id="markdown-help"
                    class="action-button bg-gray-600 hover:bg-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Markdown Guide
            </button>
        `;

        // Thêm buttons vào body
        document.body.appendChild(buttonsContainer);
        
        // Hiển thị nội dung
        if (!this.analysisResults) {
            console.error('Analysis results container not found');
            return;
        }

        this.analysisResults.innerHTML = `
            <div id="markdown-content" class="markdown-content prose dark:prose-invert max-w-none">
                ${htmlContent}
            </div>
        `;

        this.setupEditingFeatures();
    }

    formatSections(content) {
        // Add markdown formatting to the content
        return content
            .split('\n')
            .map(line => {
                // Format section headers
                if (line.match(/^\d+\./)) {
                    return `\n## ${line}\n`;
                }
                return line;
            })
            .join('\n');
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    setupModalEvents() {
        // Kiểm tra elements tồn tại trước khi thêm event listeners
        if (this.analysisResults) {
            this.analysisResults.addEventListener('click', (e) => {
                const section = this.findNearestSection(e.target);
                if (section && section.classList.contains('editable-content')) {
                    this.selectSection(section);
                }
            });
        }

        // Edit button
        if (this.editButton) {
            this.editButton.addEventListener('click', () => {
                const selectedSection = this.analysisResults?.querySelector('.selected-section');
                if (selectedSection && this.editModal) {
                    this.editContent.value = selectedSection.textContent.trim();
                    this.editModal.classList.remove('hidden');
                }
            });
        }

        // GPT button
        if (this.askGptButton) {
            this.askGptButton.addEventListener('click', () => {
                if (this.gptModal) {
                    this.gptModal.classList.remove('hidden');
                }
            });
        }

        // Save edit
        const saveEditBtn = document.getElementById('save-edit');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                const selectedSection = this.analysisResults?.querySelector('.selected-section');
                if (selectedSection && this.editContent) {
                    const newContent = this.editContent.value;
                    
                    // Preserve formatting based on the element type
                    switch (this.currentEditingTag) {
                        case 'h2':
                        case 'h3':
                            selectedSection.textContent = newContent;
                            break;
                        case 'p':
                        case 'li':
                        case 'td':
                            // For content that might contain formatting
                            selectedSection.innerHTML = marked.parse(newContent);
                            break;
                    }
                    
                    if (this.editModal) {
                        this.editModal.classList.add('hidden');
                    }
                }
            });
        }

        // Cancel buttons
        const cancelEditBtn = document.getElementById('cancel-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                if (this.editModal) {
                    this.editModal.classList.add('hidden');
                }
            });
        }

        // Send to GPT
        const sendGptBtn = document.getElementById('send-gpt');
        if (sendGptBtn) {
            sendGptBtn.addEventListener('click', async () => {
                const question = this.gptInput?.value;
                const selectedSection = this.analysisResults?.querySelector('.selected-section');
                if (question && selectedSection) {
                    await this.askGPTAboutSection(question, selectedSection.textContent);
                }
            });
        }
    }

    findNearestSection(element) {
        // Thay đổi logic tìm section để bao gồm tất cả các phần tử có thể chỉnh sửa
        while (element && !element.matches('h2, h3, p, li, td')) {
            element = element.parentElement;
        }
        return element;
    }

    selectSection(section) {
        if (!section) return;

        // Remove previous selection
        const previousSelection = this.analysisResults.querySelector('.selected-section');
        if (previousSelection) {
            previousSelection.classList.remove('selected-section');
        }

        // Add new selection
        section.classList.add('selected-section');
        
        // Show edit and GPT buttons
        this.editButton.classList.remove('hidden');
        this.askGptButton.classList.remove('hidden');

        // Store the original tag for proper formatting when saving
        this.currentEditingTag = section.getAttribute('data-original-tag');
    }

    async askGPTAboutSection(question, sectionContent) {
        try {
            const response = await fetch('/api/chat-gpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    question,
                    context: sectionContent
                })
            });

            const data = await response.json();
            
            // Add to chat history
            this.chatHistory.innerHTML += `
                <div class="mb-2">
                    <div class="font-semibold">You:</div>
                    <div>${question}</div>
                </div>
                <div class="mb-4">
                    <div class="font-semibold">GPT:</div>
                    <div>${data.response}</div>
                </div>
            `;
            
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
            this.gptInput.value = '';
            
        } catch (error) {
            console.error('Error:', error);
        }
    }

    setupEditingFeatures() {
        // Remove existing event listeners if any
        document.removeEventListener('click', this.handleClick);

        // Setup new event listeners
        this.handleClick = (e) => {
            if (e.target.id === 'view-markdown') {
                this.toggleMarkdownView();
            } else if (e.target.id === 'markdown-help') {
                this.showMarkdownHelp();
            }
        };

        document.addEventListener('click', this.handleClick);
    }

    toggleMarkdownView() {
        const currentContent = document.getElementById('markdown-content');
        const viewButton = document.getElementById('view-markdown');

        if (!currentContent || !viewButton) {
            console.error('Required elements not found');
            return;
        }

        const isMarkdown = currentContent.classList.contains('markdown-view');
        const scrollPosition = window.scrollY;

        if (isMarkdown) {
            // Lưu nội dung đã chỉnh sửa
            const textarea = currentContent.querySelector('textarea');
            if (textarea) {
                this.originalMarkdown = textarea.value;
                
                // Gửi request update
                this.updateAnalysis(this.originalMarkdown).then(() => {
                    // Chuyển về dạng HTML sau khi update thành công
                    currentContent.innerHTML = DOMPurify.sanitize(marked.parse(this.originalMarkdown));
                    currentContent.classList.remove('markdown-view');
                    viewButton.textContent = 'View/Edit Markdown';
                }).catch(error => {
                    console.error('Failed to update:', error);
                    alert('Failed to save changes. Please try again.');
                });
            }
        } else {
            // Chuyển sang chế độ edit
            currentContent.innerHTML = `
                <textarea class="w-full p-4 font-mono text-sm border rounded-lg 
                               dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 
                               auto-resize-textarea"
                >${this.originalMarkdown}</textarea>
            `;
            currentContent.classList.add('markdown-view');
            viewButton.textContent = 'Save & Preview';

            const textarea = currentContent.querySelector('textarea');
            if (textarea) {
                this.autoResizeTextArea(textarea);
                textarea.addEventListener('input', () => {
                    this.autoResizeTextArea(textarea);
                });
                textarea.focus();
            }
        }

        window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
        });
    }

    autoResizeTextArea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set new height based on scrollHeight
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    showMarkdownHelp() {
        const modalContent = `
            <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                    <div class="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Markdown Guide</h3>
                        <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" id="close-markdown-help">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-gray-200">Headers</h4>
                                <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg mt-2"># H1
## H2
### H3</pre>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-gray-200">Lists</h4>
                                <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg mt-2">- Item 1
- Item 2
  - Nested item

1. Numbered item
2. Numbered item</pre>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-gray-200">Tables</h4>
                                <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg mt-2">| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |</pre>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 dark:text-gray-200">Formatting</h4>
                                <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg mt-2">**Bold**
*Italic*
[Link](url)
![Image](url)
\`Code\`</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalContent;
        document.body.appendChild(modalElement);

        const modal = modalElement.firstElementChild;
        const closeBtn = document.getElementById('close-markdown-help');

        // Close on button click
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }

    // Thêm cleanup khi component bị hủy
    cleanup() {
        // Remove buttons container if it exists
        const buttonsContainer = document.querySelector('.fixed.right-8.top-1/3');
        if (buttonsContainer) {
            buttonsContainer.remove();
        }
    }

    // Thêm method mới để handle update
    async updateAnalysis(content) {
        if (!this.projectId) {
            throw new Error('Project ID not found. Please try analyzing the project again.');
        }

        const response = await fetch(`/integraflow/update/${this.projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update analysis');
        }

        return data;
    }

    setupProjectListEvents() {
        document.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', async () => {
                const projectId = item.dataset.projectId;
                await this.loadProject(projectId);
                
                // Update selected state
                document.querySelectorAll('.project-item').forEach(p => 
                    p.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
    }

    async loadProject(projectId) {
        try {
            this.showLoading();
            
            const response = await fetch(`/integraflow/projects/${projectId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load project');
            }

            this.projectId = data.project_id;
            this.displayResults(data.analysis.raw_content);

            // Cập nhật form fields nếu cần
            if (this.projectName && this.projectDescription) {
                this.projectName.value = data.project?.name || '';
                this.projectDescription.value = data.project?.description || '';
                this.autoResizeTextArea(this.projectDescription);
            }

            // Update form fields and store original values
            this.projectName.value = data.project.name;
            this.projectDescription.value = data.project.description;
            this.originalProjectData = {
                name: data.project.name,
                description: data.project.description
            };
            
            // Hide save button initially after loading
            document.getElementById('save-project')?.classList.add('hidden');

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load project');
        } finally {
            this.hideLoading();
        }
    }

    async updateProjectDetails() {
        if (!this.projectId) {
            throw new Error('No project selected');
        }

        const name = this.projectName.value.trim();
        const description = this.projectDescription.value.trim();

        if (!name || !description) {
            alert('Please enter both project name and description');
            return;
        }

        try {
            const response = await fetch(`/integraflow/update/${this.projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ 
                    name, 
                    description 
                })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update project details');
            }

            // Update the project in the list
            const projectItem = document.querySelector(`.project-item[data-project-id="${this.projectId}"]`);
            if (projectItem) {
                projectItem.querySelector('h4').textContent = name;
                projectItem.querySelector('p').textContent = description.length > 100 
                    ? description.substring(0, 97) + '...' 
                    : description;
            }

            alert('Project details updated successfully');

            // Update original data to match current values
            this.originalProjectData = {
                name: name,
                description: description
            };
            // Hide save button after successful save
            document.getElementById('save-project')?.classList.add('hidden');

        } catch (error) {
            console.error('Failed to update project details:', error);
            alert(error.message || 'Failed to update project details');
        }
    }

    setupInputChangeTracking() {
        const saveButton = document.getElementById('save-project');
        if (!saveButton) return;
        
        // Initially hide the save button
        saveButton.classList.add('hidden');

        // Track changes in both inputs
        this.projectName.addEventListener('input', () => this.checkForChanges());
        this.projectDescription.addEventListener('input', () => this.checkForChanges());
    }

    checkForChanges() {
        const saveButton = document.getElementById('save-project');
        if (!saveButton) return;

        const hasChanges = 
            this.projectName.value.trim() !== this.originalProjectData.name ||
            this.projectDescription.value.trim() !== this.originalProjectData.description;

        // Show/hide save button based on changes
        if (hasChanges) {
            saveButton.classList.remove('hidden');
        } else {
            saveButton.classList.add('hidden');
        }
    }

    clearForm() {
        this.projectName.value = '';
        this.projectDescription.value = '';
        this.originalProjectData = {
            name: '',
            description: ''
        };
        document.getElementById('save-project')?.classList.add('hidden');
    }

    setupDeleteProjectEvents() {
        document.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-project-btn');
            if (!deleteBtn) return;

            e.stopPropagation(); // Prevent project selection when clicking delete

            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                const projectId = deleteBtn.dataset.projectId;
                await this.deleteProject(projectId);
            }
        });
    }

    async deleteProject(projectId) {
        try {
            const response = await fetch(`/integraflow/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete project');
            }

            // Remove project from list
            const projectItem = document.querySelector(`.project-item[data-project-id="${projectId}"]`);
            if (projectItem) {
                projectItem.remove();
            }

            // Clear form if deleted project was selected
            if (this.projectId === projectId) {
                this.projectId = null;
                this.projectName.value = '';
                this.projectDescription.value = '';
                this.analysisResults.innerHTML = '';
                document.getElementById('save-project')?.classList.add('hidden');
            }

            // Show empty state if no projects left
            const projectsList = document.getElementById('projects-list');
            if (!projectsList.children.length) {
                projectsList.innerHTML = `
                    <div class="text-gray-500 dark:text-gray-400 text-center py-4">
                        No projects yet
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to delete project');
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('/integraflow/projects', {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const data = await response.json();

            if (data.success) {
                this.updateProjectsList(data.projects);
            } else {
                throw new Error(data.error || 'Failed to load projects');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            alert('Failed to load projects. Please try again.');
        }
    }

    updateProjectsList(projects) {
        // Xóa danh sách hiện tại
        this.projectsList.innerHTML = '';

        // Thêm các dự án mới vào danh sách
        projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item cursor-pointer rounded-lg transition-colors duration-200';
            projectItem.dataset.projectId = project.id;

            projectItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-gray-100">${project.name}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ${project.description.length > 100 ? project.description.substring(0, 97) + '...' : project.description}
                        </p>
                    </div>
                    <button class="delete-project-btn p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            data-project-id="${project.id}"
                            title="Delete project">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div class="flex gap-2 mt-2">
                    <span class="project-stat">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        ${new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span class="project-stat">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        ${new Date(project.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            `;

            this.projectsList.appendChild(projectItem);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectAnalyzer();
});
