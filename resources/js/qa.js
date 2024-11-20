import { marked } from './utils/marked-config';
import DOMPurify from 'dompurify';

const importForm = document.getElementById("import-form");
const modal = document.getElementById("sheet-selection-modal");
const sheetList = document.getElementById("sheet-list");
const cancelButton = document.getElementById("cancel-import");
const confirmButton = document.getElementById("confirm-import");
let sheetsData = null;

// Thêm biến kiểm soát loading overlay
let loadingOverlay = document.getElementById('loading-overlay');

function showLoading(message = 'Loading...') {
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('#loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Show modal with sheet list
async function showSheetSelectionModal(sheets) {
    const url = document.getElementById("sheet-url").value;
    const sheetNames = sheets.map((sheet) => sheet.sheet_name);
    const existingSheets = await checkExistingSheets(url, sheetNames);

    const sheetListHtml = sheets
        .map((sheet, index) => {
            const isExisting = existingSheets.includes(sheet.sheet_name);
            return `
                    <div class="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <input type="checkbox" 
                            id="sheet-${index}" 
                            value="${sheet.sheet_name}"
                            ${isExisting ? "disabled" : ""}
                            class="rounded border-gray-300 dark:border-gray-700">
                        <label for="sheet-${index}" class="flex-1 text-gray-700 dark:text-gray-300">
                            ${sheet.sheet_name}
                            ${
                                isExisting
                                    ? '<span class="text-yellow-500 ml-2">(Already imported)</span>'
                                    : ""
                            }
                            <span class="text-sm text-gray-500 dark:text-gray-400 block">
                                ${sheet.headers?.length || 0} columns, ${
                sheet.content?.length || 0
            } rows
                            </span>
                        </label>
                    </div>
                `;
        })
        .join("");

    sheetList.innerHTML = sheetListHtml;
    modal.classList.remove("hidden");
}

// Hide modal
function hideModal() {
    modal.classList.add("hidden");
    sheetsData = null; // Reset sheetsData when closing modal
}

// Function to handle loading state
function setPreviewLoading(isLoading) {
    const button = document.querySelector(".preview-btn");
    const input = document.getElementById("sheet-url");
    const btnText = button.querySelector(".btn-text");

    if (isLoading) {
        button.classList.add("loading");
        input.classList.add("disabled");
        input.disabled = true;
        btnText.textContent = "Reading...";
    } else {
        button.classList.remove("loading");
        input.classList.remove("disabled");
        input.disabled = false;
        btnText.textContent = "Preview";
    }
}

// Update the form submit handler
importForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("sheet-url").value;

    if (!url) {
        alert("Please enter a Google Sheet URL");
        return;
    }

    try {
        setPreviewLoading(true);

        const response = await fetch("/qa/preview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({ sheet_url: url }),
        });

        const data = await response.json();
        if (response.ok) {
            sheetsData = data.sheets;
            showSheetSelectionModal(data.sheets);
        } else {
            alert(data.error || "Failed to fetch sheet data");
        }
    } catch (error) {
        console.error("Preview error:", error);
        alert("Failed to fetch sheet data");
    } finally {
        setPreviewLoading(false);
    }
});

// Handle modal buttons
cancelButton.addEventListener("click", hideModal);

confirmButton.addEventListener("click", async () => {
    const selectedCheckboxes = document.querySelectorAll(
        "#sheet-list input:checked"
    );
    const selectedSheetNames = Array.from(selectedCheckboxes).map(
        (cb) => cb.value
    );

    if (selectedSheetNames.length === 0) {
        alert("Please select at least one sheet");
        return;
    }

    const selectedSheets = sheetsData.filter((sheet) =>
        selectedSheetNames.includes(sheet.sheet_name)
    );

    try {
        const response = await fetch("/qa/import", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({
                sheet_url: document.getElementById("sheet-url").value,
                selected_sheets: selectedSheets,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            let message = "";
            if (data.imported_sheets?.length > 0) {
                message += `Successfully imported: ${data.imported_sheets.join(
                    ", "
                )}\n`;
            }
            if (data.duplicate_sheets?.length > 0) {
                message += `Already exists: ${data.duplicate_sheets.join(
                    ", "
                )}`;
            }
            alert(message);
            hideModal();
            document.getElementById("sheet-url").value = "";
            await refreshSheetsList();
        } else {
            alert(data.error || "Failed to import sheets");
        }
    } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import sheet data");
    }
});

// Thêm biến để theo dõi trạng thái loading
let isRefreshing = false;

// Function để xoay icon khi đang refresh
function startRefreshAnimation() {
    const refreshIcon = document.querySelector("#refresh-sheets svg");
    refreshIcon.classList.add("animate-spin");
}

// Function để dừng animation
function stopRefreshAnimation() {
    const refreshIcon = document.querySelector("#refresh-sheets svg");
    refreshIcon.classList.remove("animate-spin");
}

function formatDateTime(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    // Format: DD/MM/YYYY HH:mm
    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

// Thêm biến để lưu sheet đang được chọn
let selectedSheetId = null;

async function refreshSheetsList() {
    if (isRefreshing) return;
    
    try {
        isRefreshing = true;
        startRefreshAnimation();
        
        const response = await fetch('/qa/sheets');
        const data = await response.json();
        
        const sheetsList = document.getElementById('sheets-list');
        
        if (data.sheets.length === 0) {
            sheetsList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    No sheets imported yet
                </div>
            `;
            return;
        }
        
        sheetsList.innerHTML = data.sheets
            .map(sheet => `
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer ${selectedSheetId === sheet.id ? 'ring-2 ring-blue-500' : ''}"
                    data-sheet-id="${sheet.id}">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium text-gray-900 dark:text-gray-100">${sheet.sheet_name}</h4>
                            <div class="flex items-center gap-2">
                                <button 
                                    class="chat-with-sheet-btn text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200"
                                    data-sheet-id="${sheet.id}"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </button>
                                <button 
                                    class="update-sheet-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                    data-sheet-id="${sheet.id}"
                                    data-sheet-url="${sheet.sheet_url}"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                ${formatDateTime(sheet.updated_at)}
                            </div>

                            <div class="flex items-center gap-3">
                                <span class="sheet-stat">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"></path>
                                    </svg>
                                    ${sheet.columns_count}
                                </span>

                                <span class="sheet-stat">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    ${sheet.rows_count}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `)
            .join("");

        // Add click handlers
        document.querySelectorAll('.chat-with-sheet-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sheetId = btn.dataset.sheetId;
                
                // Lấy thông tin sheet
                const response = await fetch(`/qa/sheets/${sheetId}`);
                const data = await response.json();
                
                // Cập nhật tiêu đề chat
                const chatTitle = document.getElementById('chat-title');
                if (chatTitle) {
                    chatTitle.textContent = `Chat with: ${data.sheet_name}`;
                }

                // Gọi hàm select sheet để chat
                await selectSheetForChat(sheetId);
            });
        });

        // Update button handlers
        document.querySelectorAll('.update-sheet-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sheetId = btn.dataset.sheetId;
                const sheetUrl = btn.dataset.sheetUrl;
                await updateSingleSheet(sheetId, sheetUrl);
            });
        });
    } catch (error) {
        console.error('Failed to refresh sheets list:', error);
    } finally {
        isRefreshing = false;
        stopRefreshAnimation();
    }
}

// Sửa lại event listener cho nút refresh
document.getElementById('refresh-sheets').addEventListener('click', (e) => {
    e.preventDefault();
    refreshSheetsList();
});

// Initial load - chỉ gọi một lần khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadingOverlay = document.getElementById('loading-overlay');
    refreshSheetsList();
});

// Function để cập nhật một sheet cụ thể
async function updateSingleSheet(sheetId, sheetUrl) {
    const button = document.querySelector(`.update-sheet-btn[data-sheet-id="${sheetId}"]`);
    const buttonIcon = button.querySelector('svg');
    try {
        // Chỉ xoay icon
        buttonIcon.classList.add("animate-spin");

        const response = await fetch("/qa/update-sheet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({
                sheet_id: sheetId,
                sheet_url: sheetUrl,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            const message =
                `Sheet updated successfully!\n` +
                `Previous rows: ${data.previous_rows}\n` +
                `Current rows: ${data.current_rows}\n` +
                `Changes: ${data.current_rows - data.previous_rows} rows`;
            alert(message);
            await refreshSheetsList();
        } else {
            alert(data.error || "Failed to update sheet");
        }
    } catch (error) {
        console.error("Failed to update sheet:", error);
        alert("Failed to update sheet");
    } finally {
        // Dừng xoay icon
        buttonIcon.classList.remove("animate-spin");
    }
}

// Add function to check existing sheets
async function checkExistingSheets(url, sheetNames) {
    try {
        const response = await fetch("/qa/check-existing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
            body: JSON.stringify({
                sheet_url: url,
                sheet_names: sheetNames,
            }),
        });

        const data = await response.json();
        return data.existing_sheets || [];
    } catch (error) {
        console.error("Failed to check existing sheets:", error);
        return [];
    }
}

// Add dark mode support
if (document.documentElement.classList.contains("dark")) {
    document.querySelector(".url-input.disabled").style.backgroundColor =
        "#374151";
}

// Optional: Add transition for smoother dark mode changes
document.querySelector(".url-input").style.transition = "background-color 0.3s";

// Function để chọn sheet để chat
async function selectSheetForChat(sheetId) {
    selectedSheetId = sheetId;
    
    try {
        // Cập nhật UI để hiển thị sheet đang được chọn
        document.querySelectorAll('#sheets-list > div').forEach(div => {
            if (div.dataset.sheetId === sheetId) {
                div.classList.add('ring-2', 'ring-blue-500');
            } else {
                div.classList.remove('ring-2', 'ring-blue-500');
            }
        });

        // Lấy thông tin sheet và lịch sử chat
        const response = await fetch(`/qa/sheets/${sheetId}`);
        const data = await response.json();
        
        // Cập nhật tiêu đề chat
        const chatTitle = document.getElementById('chat-title');
        if (chatTitle) {
            chatTitle.textContent = `Chat with: ${data.sheet_name}`;
        }

        // Hiển thị lịch sử chat với markdown
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && data.chats) {
            chatMessages.innerHTML = data.chats.map(chat => 
                renderMessage(chat.message, chat.role)
            ).join('');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Enable chat input và nút send
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.querySelector('#chat-form button[type="submit"]');
        
        if (chatInput && sendButton) {
            chatInput.disabled = false;
            chatInput.placeholder = 'Ask anything about this sheet...';
            sendButton.disabled = false;
        }

    } catch (error) {
        console.error('Failed to select sheet:', error);
    }
}

// Xử lý submit chat form
document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedSheetId) {
        alert('Please select a sheet first');
        return;
    }

    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;

    try {
        chatInput.disabled = true;
        const sendButton = document.querySelector('#chat-form button[type="submit"]');
        sendButton.disabled = true;
        
        // Add user message with markdown
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML += renderMessage(message, 'user');
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Clear input and reset height
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Hide markdown preview
        document.getElementById('markdown-preview').classList.add('hidden');

        // Show loading message
        const loadingId = Date.now();
        chatMessages.innerHTML += `
            <div id="loading-${loadingId}" class="flex justify-start mb-3">
                <div class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg py-2 px-4">
                    <div class="flex items-center gap-2">
                        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </div>
                </div>
            </div>
        `;

        // Send message to server
        const response = await fetch('/qa/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                sheet_id: selectedSheetId,
                message: message
            })
        });

        // Remove loading message
        document.getElementById(`loading-${loadingId}`).remove();

        const data = await response.json();
        
        if (response.ok) {
            // Add AI response with markdown
            chatMessages.innerHTML += renderMessage(data.response, 'assistant');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            throw new Error(data.error || 'Failed to get response');
        }

    } catch (error) {
        console.error('Chat error:', error);
        alert('Failed to send message: ' + error.message);
    } finally {
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
});

// Function để render tin nhắn với markdown
function renderMessage(message, role) {
    const parsedContent = DOMPurify.sanitize(marked.parse(message));
    return `
        <div class="flex justify-${role === 'user' ? 'end' : 'start'} mb-3">
            <div class="max-w-[80%] ${role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} rounded-lg py-2 px-4 markdown-content">
                ${parsedContent}
            </div>
        </div>
    `;
}

// Function để hiển thị lịch sử chat
function displayChatHistory(chats) {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = chats.map(chat => 
            renderMessage(chat.message, chat.role)
        ).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Auto-resize textarea
const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Markdown preview
let previewTimeout;
chatInput.addEventListener('input', function() {
    clearTimeout(previewTimeout);
    const preview = document.getElementById('markdown-preview');
    
    if (this.value.trim()) {
        previewTimeout = setTimeout(() => {
            preview.innerHTML = DOMPurify.sanitize(marked.parse(this.value));
            preview.classList.remove('hidden');
        }, 500);
    } else {
        preview.classList.add('hidden');
    }
});

// Hide preview when clicking outside
document.addEventListener('click', function(e) {
    const preview = document.getElementById('markdown-preview');
    const input = document.getElementById('chat-input');
    if (!preview.contains(e.target) && !input.contains(e.target)) {
        preview.classList.add('hidden');
    }
});
