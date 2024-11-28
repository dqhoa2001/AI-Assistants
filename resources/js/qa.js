import { marked } from "./utils/marked-config";
import DOMPurify from "dompurify";

const importForm = document.getElementById("import-form");
const modal = document.getElementById("sheet-selection-modal");
const sheetList = document.getElementById("sheet-list");
const cancelButton = document.getElementById("cancel-import");
const confirmButton = document.getElementById("confirm-import");
let sheetsData = null;

// Add loading overlay control variable
let loadingOverlay = document.getElementById("loading-overlay");

function showLoading(message = "Loading...") {
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector("#loading-text");
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingOverlay.classList.remove("hidden");
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
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
                                ${sheet.headers?.length || 0}, ${
                sheet.content?.length || 0
            }
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

// Add variable to track loading state
let isRefreshing = false;

// Function to rotate icon during refresh
function startRefreshAnimation() {
    const refreshIcon = document.querySelector("#refresh-sheets svg");
    refreshIcon.classList.add("animate-spin");
}

// Function to stop animation
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

// Add variable to store selected sheet
let selectedSheetId = null;

async function refreshSheetsList() {
    if (isRefreshing) return;

    try {
        isRefreshing = true;
        startRefreshAnimation();

        const response = await fetch("/qa/sheets");
        const data = await response.json();
        
        const sheetsList = document.getElementById("sheets-list");
        
        if (data.sheets.length === 0) {
            sheetsList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    No sheets imported yet
                </div>
            `;
            return;
        }

        // Render sheets list với selected state
        sheetsList.innerHTML = data.sheets
            .map(sheet => `
                <div class="sheet-item ${selectedSheetId === sheet.id ? 'selected' : ''}"
                     data-sheet-id="${sheet.id}">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium text-gray-900 dark:text-gray-100">${sheet.sheet_name}</h4>
                            <div class="flex items-center gap-2">
                                <button 
                                    class="delete-sheet-btn text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                    data-sheet-id="${sheet.id}"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button 
                                    class="update-sheet-btn p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                                    data-sheet-id="${sheet.id}"
                                    data-sheet-url="${sheet.sheet_url}"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                                    ${sheet.columns_count || sheet.headers?.length || 0} 
                                </span>

                                <span class="sheet-stat">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    ${sheet.rows_count || sheet.content?.length || 0} 
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `)
            .join("");

        // Add click handlers for sheet items
        document.querySelectorAll('.sheet-item').forEach(item => {
            item.addEventListener('click', async () => {
                const sheetId = item.dataset.sheetId;
                
                // Update selected state
                document.querySelectorAll('.sheet-item').forEach(s => {
                    s.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // Update selectedSheetId
                selectedSheetId = sheetId;
                
                // Fetch chat history
                await selectSheetForChat(sheetId);
            });
        });

        // Add update button handlers
        document.querySelectorAll('.update-sheet-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent sheet selection
                const sheetId = btn.dataset.sheetId;
                const sheetUrl = btn.dataset.sheetUrl;
                await updateSingleSheet(sheetId, sheetUrl);
            });
        });

        // Add delete button handlers
        document.querySelectorAll('.delete-sheet-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent sheet selection
                const sheetId = btn.dataset.sheetId;
                await deleteSheet(sheetId);
            });
        });
    } catch (error) {
        console.error("Failed to refresh sheets list:", error);
    } finally {
        isRefreshing = false;
        stopRefreshAnimation();
    }
}

// Update event listener for refresh button
document.getElementById("refresh-sheets").addEventListener("click", (e) => {
    e.preventDefault();
    refreshSheetsList();
});

// Initial load - called once when page loads
document.addEventListener("DOMContentLoaded", () => {
    loadingOverlay = document.getElementById("loading-overlay");
    refreshSheetsList();
});

// Function to update a specific sheet
async function updateSingleSheet(sheetId, sheetUrl) {
    const button = document.querySelector(
        `.update-sheet-btn[data-sheet-id="${sheetId}"]`
    );
    const buttonIcon = button.querySelector("svg");
    try {
        // Only rotate icon
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
        // Stop icon rotation
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


async function selectSheetForChat(sheetId) {
    try {
        // Update selected state
        selectedSheetId = sheetId;
        document.querySelectorAll('#sheets-list > div').forEach(div => {
            div.classList.toggle('selected', div.dataset.sheetId === sheetId);
        });

        // Fetch sheet info and chat history
        const response = await fetch(`/qa/sheets/${sheetId}`);
        const data = await response.json();

        // Update chat title
        const chatTitle = document.getElementById('chat-title');
        if (chatTitle) {
            chatTitle.textContent = `Chat with: ${data.sheet_name}`;
        }

        // Display chat history
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && data.chats) {
            chatMessages.innerHTML = data.chats
                .map(chat => renderMessage(chat.message, chat.role))
                .join('');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Enable chat interface
        const chatInput = document.getElementById("chat-input");
        const sendButton = document.querySelector('#chat-form button[type="submit"]');
        if (chatInput && sendButton) {
            chatInput.disabled = false;
            chatInput.placeholder = "Ask anything about this sheet...";
            sendButton.disabled = false;
        }
    } catch (error) {
        console.error("Failed to select sheet:", error);
    }
}

// add loading indicator
function showLoadingIndicator() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "flex justify-start animate-fade-in";
    messageDiv.id = "loading-indicator";

    messageDiv.innerHTML = `
        <div class="max-w-[80%] break-words bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
            <div class="typing-indicator">
                <span style="animation-delay: 0s"></span>
                <span style="animation-delay: 0.2s"></span>
                <span style="animation-delay: 0.4s"></span>
            </div>
        </div>
    `;

    const chatMessages = document.getElementById("chat-messages");
    chatMessages.appendChild(messageDiv);

    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

document.getElementById("chat-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedSheetId) {
        alert("Please select a sheet first");
        return;
    }

    const chatInput = document.getElementById("chat-input");
    const modelSelect = document.getElementById("model-select");
    const sendButton = document.querySelector('#chat-form button[type="submit"]');
    const message = chatInput.value.trim();

    if (!message) return;

    try {
        chatInput.disabled = true;
        sendButton.disabled = true;

        const messageToSend = message;
        chatInput.value = "";
        chatInput.style.height = "auto";

        const chatMessages = document.getElementById("chat-messages");
        const userMessage = renderMessage(messageToSend, "user");
        chatMessages.insertAdjacentHTML("beforeend", userMessage);

        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);

        showLoadingIndicator();

        const response = await fetch("/qa/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({
                sheet_id: selectedSheetId,
                message: messageToSend,
                model: modelSelect.value
            }),
        });

        document.getElementById("loading-indicator")?.remove();

        const data = await response.json();

        if (response.ok) {
            const assistantMessage = renderMessage(data.response, "assistant");
            chatMessages.insertAdjacentHTML("beforeend", assistantMessage);

            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        } else {
            throw new Error(data.error || "Failed to get response");
        }
    } finally {
        chatInput.disabled = false;
        sendButton.disabled = false;
    }
});

function renderMessage(message, role) {
    const parsedContent = DOMPurify.sanitize(marked.parse(message));
    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return `
        <div class="flex justify-${
            role === "user" ? "end" : "start"
        } animate-fade-in">
            <div class="max-w-[80%] break-words ${
                role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            } 
                rounded-xl px-4 py-3 shadow-sm">
                <div class="whitespace-normal text-sm prose dark:prose-invert max-w-none ${
                    role === "user"
                        ? "prose-white prose-pre:text-gray-900"
                        : "prose-gray dark:prose-invert"
                }">
                    ${parsedContent}
                </div>
                <div class="text-xs opacity-70 mt-1">
                    ${currentTime}
                </div>
            </div>
        </div>
    `;
}

// Auto-resize textarea
const chatInput = document.getElementById("chat-input");
if (chatInput) {
    chatInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });
}

// Markdown preview
const preview = document.getElementById("markdown-preview");
let previewTimeout;

if (chatInput && preview) {
    chatInput.addEventListener("input", function () {
        // Auto-resize textarea
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";

        clearTimeout(previewTimeout);

        if (!this.value.trim()) {
            preview.classList.add("hidden");
            return;
        }

        const hasMarkdown = /[*#`_~\[\]\(\)\{\}]/.test(this.value);

        if (hasMarkdown) {
            previewTimeout = setTimeout(() => {
                preview.innerHTML = DOMPurify.sanitize(
                    marked.parse(this.value)
                );
                preview.classList.remove("hidden");
            }, 500);
        } else {
            preview.classList.add("hidden");
        }
    });

    document.getElementById("chat-form")?.addEventListener("submit", () => {
        preview.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!chatInput.contains(e.target) && !preview.contains(e.target)) {
            preview.classList.add("hidden");
        }
    });
}

// Hide preview when clicking outside
document.addEventListener("click", function (e) {
    const preview = document.getElementById("markdown-preview");
    const input = document.getElementById("chat-input");
    if (!preview.contains(e.target) && !input.contains(e.target)) {
        preview.classList.add("hidden");
    }
});

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

// Initialize chat functionality
function initializeChat() {
    const chatInput = document.getElementById("chat-input");
    const chatForm = document.getElementById("chat-form");
    const chatMessages = document.getElementById("chat-messages");

    if (chatInput) {
        // Handle auto-resize
        chatInput.addEventListener("input", () => {
            autoResizeTextarea(chatInput);
        });

        // Handle Enter key
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (chatInput.value.trim() && chatForm) {
                    chatForm.dispatchEvent(new Event("submit"));
                }
            }
        });
    }

    if (chatForm) {
        chatForm.addEventListener("submit", handleChatSubmit);
    }
}

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", initializeChat);

async function handleChatSubmit(e) {
    e.preventDefault();

    if (!selectedSheetId) {
        alert("Please select a sheet first");
        return;
    }

    const message = chatInput.value.trim();
    if (!message) return;

    try {
        // Disable input and button
        chatInput.disabled = true;
        const sendButton = chatForm.querySelector('button[type="submit"]');
        if (sendButton) sendButton.disabled = true;

        // Clear input before showing message
        chatInput.value = "";
        autoResizeTextarea(chatInput);

        // Display user message
        const userMessage = renderMessage(message, "user");
        chatMessages.insertAdjacentHTML("beforeend", userMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send message and get response
        const response = await fetch("/qa/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({
                sheet_id: selectedSheetId,
                message: message,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            const assistantMessage = renderMessage(data.response, "assistant");
            chatMessages.insertAdjacentHTML("beforeend", assistantMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            throw new Error(data.error || "Failed to get response");
        }
    } catch (error) {
        console.error("Chat error:", error);
        alert("Failed to send message: " + error.message);
    } finally {
        chatInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        chatInput.focus();
    }
}

// Function to delete a specific sheet
async function deleteSheet(sheetId) {
    if (!confirm('Are you sure you want to delete this sheet? This action cannot be undone.')) {
        return;
    }

    const button = document.querySelector(
        `.delete-sheet-btn[data-sheet-id="${sheetId}"]`
    );
    const buttonIcon = button.querySelector("svg");

    try {
        // Add rotation animation
        buttonIcon.classList.add("animate-spin");

        const response = await fetch(`/qa/sheets/${sheetId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]'
                ).content,
            },
        });

        if (response.ok) {
            // If current sheet is deleted, clear chat
            if (selectedSheetId === sheetId) {
                selectedSheetId = null;
                const chatMessages = document.getElementById('chat-messages');
                const chatTitle = document.getElementById('chat-title');
                if (chatMessages) chatMessages.innerHTML = '';
                if (chatTitle) chatTitle.textContent = 'Select a sheet to start chatting';
                
                // Disable chat input
                const chatInput = document.getElementById('chat-input');
                const sendButton = document.querySelector('#chat-form button[type="submit"]');
                if (chatInput) {
                    chatInput.disabled = true;
                    chatInput.placeholder = 'Please select a sheet first...';
                }
                if (sendButton) sendButton.disabled = true;
            }

            // Refresh sheets list
            await refreshSheetsList();
        } else {
            const data = await response.json();
            throw new Error(data.error || "Failed to delete sheet");
        }
    } catch (error) {
        console.error("Failed to delete sheet:", error);
        alert("Failed to delete sheet: " + error.message);
    } finally {
        buttonIcon.classList.remove("animate-spin");
    }
}
