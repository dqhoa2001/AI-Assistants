<x-app-layout>
    <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex gap-6">
                <!-- Left Column - Import & Sheets List -->
                <div class="w-1/3">
                    <!-- Import Section -->
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold mb-4">Import from Google Sheet</h3>
                            <form id="import-form" class="flex gap-4">
                                <input type="text" 
                                    id="sheet-url" 
                                    class="url-input flex-1 rounded-md border-gray-300 dark:border-gray-700"
                                    placeholder="Enter Google Sheet URL">
                                <button type="submit" 
                                    class="preview-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                                    <span class="btn-text">Preview</span>
                                    <span class="spinner"></span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Imported Sheets List -->
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold">Imported Sheets</h3>
                                <button id="refresh-sheets" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </div>
                            <div id="sheets-list" class="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                                <!-- Sheets will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Chat Interface -->
                <div class="w-2/3">
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg h-[calc(100vh-8rem)]">
                        <div class="p-6 h-full flex flex-col">
                            <h3 id="chat-title" class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight mb-4">
                                Select a sheet to start chatting
                            </h3>
                            
                            <!-- Chat Messages Area -->
                            <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <!-- Messages will be displayed here -->
                            </div>

                            <!-- Input Area -->
                            <div class="border-t dark:border-gray-700 pt-4">
                                <form id="chat-form" class="flex gap-4">
                                    <div class="flex-1 relative">
                                        <textarea 
                                            id="chat-input"
                                            rows="1"
                                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none overflow-hidden"
                                            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                                            disabled
                                        ></textarea>
                                        <div id="markdown-preview" class="hidden mt-2 p-2 rounded bg-gray-50 dark:bg-gray-700"></div>
                                    </div>
                                    <button type="submit" 
                                        class="send-button"
                                        disabled
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Sheet Selection Modal -->
    <div id="sheet-selection-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 class="text-lg font-semibold mb-4">Select Sheets to Import</h3>
            <div id="sheet-list" class="space-y-2 max-h-96 overflow-y-auto">
                <!-- Sheet checkboxes will be added here -->
            </div>
            <div class="mt-4 flex justify-end space-x-3">
                <button id="cancel-import" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button id="confirm-import" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Import
                </button>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="loading-overlay hidden">
        <div class="loading-content dark:bg-gray-800">
            <div class="loading-spinner"></div>
            <div class="text-gray-700 dark:text-gray-300" id="loading-text">
                Loading sheet data...
            </div>
        </div>
    </div>
    
    @vite(['resources/css/qa.css', 'resources/css/chat.css', 'resources/js/qa.js'])
</x-app-layout>