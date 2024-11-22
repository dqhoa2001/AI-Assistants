<x-app-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                {{ __('Integra Flow AI - Project Analysis') }}
            </h2>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Left Column - Project Input Form -->
                <div class="w-full lg:w-1/3">
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="p-6">
                            <div class="mb-6">
                                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                    Project Name
                                </label>
                                <input type="text" 
                                       id="project-name"
                                       class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                       placeholder="Enter project name">
                            </div>
                            <div class="mb-6">
                                <label class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                    Project Description
                                </label>
                                <textarea id="project-description"
                                          class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 overflow-hidden resize-none"
                                          rows="4"
                                          style="min-height: 6rem;"
                                          placeholder="Describe your project"></textarea>
                            </div>
                            <button id="analyze-project"
                                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                Analyze Project
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Analysis Results -->
                <div class="w-full lg:w-2/3">
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg min-h-[calc(100vh-12rem)]">
                        <div class="p-6 h-full">
                            <!-- Analysis Results Header -->
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Analysis Results</h3>
                                <div class="flex gap-2">
                                    <button id="edit-analysis" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 hidden">
                                        Edit Section
                                    </button>
                                    <button id="ask-gpt" class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 hidden">
                                        Ask GPT
                                    </button>
                                </div>
                            </div>

                            <!-- Results Content -->
                            <div id="analysis-results" class="prose dark:prose-invert max-w-none markdown-content relative">
                                <!-- Results will be populated here -->
                            </div>

                            <!-- Edit Modal -->
                            <div id="edit-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
                                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
                                        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Edit Section</h3>
                                        <textarea id="edit-content" class="w-full h-64 p-2 mb-4 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"></textarea>
                                        <div class="flex justify-end gap-2">
                                            <button id="cancel-edit" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                                Cancel
                                            </button>
                                            <button id="save-edit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- GPT Chat Modal -->
                            <div id="gpt-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
                                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
                                        <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Ask GPT about this section</h3>
                                        <div id="chat-history" class="mb-4 h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"></div>
                                        <div class="flex gap-2">
                                            <input type="text" 
                                                   id="gpt-input" 
                                                   class="flex-1 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                   placeholder="Type your question...">
                                            <button id="send-gpt" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <div class="loading-spinner mb-4"></div>
                <div class="text-gray-700 dark:text-gray-300">
                    Analyzing project...
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        @vite(['resources/css/integraflow.css', 'resources/js/integraflow.js'])
    @endpush
</x-app-layout>
