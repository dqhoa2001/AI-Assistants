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
                <!-- Left Column - Project List & Input Form -->
                <div class="w-full lg:w-1/3 space-y-6">
                    <!-- Projects List -->
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Your Projects
                            </h3>
                            <div class="space-y-3" id="projects-list">
                                @forelse($projects as $project)
                                    <div class="project-item cursor-pointer rounded-lg transition-colors duration-200"
                                         data-project-id="{{ $project->id }}">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h4 class="font-medium text-gray-900 dark:text-gray-100">
                                                    {{ $project->name }}
                                                </h4>
                                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {{ Str::limit($project->description, 100) }}
                                                </p>
                                            </div>
                                            <button class="delete-project-btn p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                                    data-project-id="{{ $project->id }}"
                                                    title="Delete project">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="flex gap-2 mt-2">
                                            <span class="project-stat text-gray-500 dark:text-gray-400">
                                                <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                </svg>
                                                {{ $project->created_at->format('M d, Y') }}
                                            </span>
                                            <span class="project-stat text-gray-500 dark:text-gray-400">
                                                <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                {{ $project->created_at->format('H:i') }}
                                            </span>
                                        </div>
                                    </div>
                                @empty
                                    <div class="text-gray-500 dark:text-gray-400 text-center py-4">
                                        No projects yet
                                    </div>
                                @endforelse
                            </div>
                        </div>
                    </div>

                    <!-- Project Input Form -->
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                New Project Analysis
                            </h3>
                            
                            <!-- Project Form -->
                            <div class="space-y-6 max-w-2xl">
                                <!-- Project Name -->
                                <div>
                                    <label for="project-name" 
                                           class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Project Name
                                    </label>
                                    <input type="text" 
                                           id="project-name"
                                           class="w-full px-4 py-2 rounded-lg border border-gray-300 
                                                  dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300
                                                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                  transition duration-150 ease-in-out"
                                           placeholder="Enter project name">
                                </div>

                                <!-- Project Description -->
                                <div>
                                    <label for="project-description"
                                           class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Project Description
                                    </label>
                                    <textarea id="project-description"
                                              class="w-full px-4 py-2 rounded-lg border border-gray-300
                                                     dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300
                                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                     transition duration-150 ease-in-out
                                                     min-h-[120px] resize-none"
                                              placeholder="Enter project description"></textarea>
                                </div>

                                <!-- Model Selection -->
                                <div>
                                    <label for="model-select" 
                                           class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Model
                                    </label>
                                    <select id="model-select" name="model" 
                                            class="w-full px-4 py-2 rounded-lg border border-gray-300 
                                                   dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300
                                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                   transition duration-150 ease-in-out">
                                        <option value="gpt">GPT</option>
                                        <option value="gemini">Gemini</option>
                                        <option value="claude">Claude</option>
                                    </select>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex flex-col sm:flex-row gap-4 pt-2">
                                    <button id="save-project" 
                                            class="hidden inline-flex items-center justify-center
                                                   px-4 py-2.5 border border-transparent
                                                   text-sm font-medium rounded-lg
                                                   text-white bg-green-600 hover:bg-green-700
                                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                   transition-colors duration-200">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                                        </svg>
                                        Save Project Details
                                    </button>

                                    <button id="analyze-project"
                                            class="inline-flex items-center justify-center
                                                   px-4 py-2.5 border border-transparent
                                                   text-sm font-medium rounded-lg
                                                   text-white bg-blue-600 hover:bg-blue-700
                                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                                   transition-colors duration-200">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                        </svg>
                                        Analyze Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Analysis Results -->
                <div class="w-full lg:w-2/3">
                    <div id="analysis-results" class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div class="prose dark:prose-invert max-w-none">
                            <p class="text-gray-500 dark:text-gray-400 text-center">
                                Select a project or create a new analysis
                            </p>
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
