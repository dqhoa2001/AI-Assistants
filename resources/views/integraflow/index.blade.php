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
            <!-- Project Input Form -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
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
                                  class="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                  rows="4"
                                  placeholder="Describe your project"></textarea>
                    </div>
                    <button id="analyze-project"
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Analyze Project
                    </button>
                </div>
            </div>

            <!-- Analysis Results -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mt-6">
                <div class="p-6">
                    <div id="analysis-results" class="space-y-6 markdown-body">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loading-overlay" class="loading-overlay hidden">
        <div class="loading-content dark:bg-gray-800">
            <div class="loading-spinner"></div>
            <div class="text-gray-700 dark:text-gray-300" id="loading-text">
                Analyzing project...
            </div>
        </div>
    </div>

    @push('scripts')
        @vite(['resources/css/integraflow.css', 'resources/js/integraflow.js'])
    @endpush
</x-app-layout>
