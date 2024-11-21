import { marked } from 'marked';
import DOMPurify from 'dompurify';

class ProjectAnalyzer {
    constructor() {
        this.projectName = document.getElementById('project-name');
        this.projectDescription = document.getElementById('project-description');
        this.analyzeButton = document.getElementById('analyze-project');
        this.analysisResults = document.getElementById('analysis-results');
        this.loadingOverlay = document.getElementById('loading-overlay');

        // Cấu hình marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.analyzeButton.addEventListener('click', () => this.analyzeProject());
    }

    async analyzeProject() {
        const name = this.projectName.value.trim();
        const description = this.projectDescription.value.trim();

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
                body: JSON.stringify({ name, description })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            this.displayResults(data.analysis.raw_content);

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred while analyzing the project');
        } finally {
            this.hideLoading();
            this.analyzeButton.disabled = false;
        }
    }

    displayResults(content) {
        // Format the content with section headers
        const formattedContent = this.formatSections(content);
        
        // Convert markdown to HTML and sanitize
        const htmlContent = DOMPurify.sanitize(marked.parse(formattedContent));

        this.analysisResults.innerHTML = `
            <div class="markdown-content prose dark:prose-invert max-w-none">
                ${htmlContent}
            </div>
        `;

        // Scroll to results
        this.analysisResults.scrollIntoView({ behavior: 'smooth' });
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectAnalyzer();
});
