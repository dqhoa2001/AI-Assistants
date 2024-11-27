<x-app-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                {{ __('Chat with GPT') }}
            </h2>
            <button 
                id="clear-history"
                class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
                Clear History
            </button>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <!-- Chat Container -->
                    <div class="flex flex-col h-[600px]">
                        <!-- Messages Area -->
                        <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            @foreach($chatHistory as $chat)
                                <div class="flex justify-{{ $chat->role === 'user' ? 'end' : 'start' }} animate-fade-in">
                                    <div class="max-w-[80%] break-words {{ $chat->role === 'user' 
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700' }} 
                                        rounded-xl px-4 py-3 shadow-sm">
                                        <div class="whitespace-normal text-sm prose dark:prose-invert max-w-none {{ $chat->role === 'user' 
                                            ? 'prose-white prose-pre:text-gray-900' 
                                            : 'prose-gray dark:prose-invert' }}">
                                            {!! Str::markdown(html_entity_decode($chat->content)) !!}
                                        </div>
                                        <div class="text-xs opacity-70 mt-1">
                                            {{ $chat->created_at->format('H:i') }}
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                        
                        <!-- Input Area -->
                        <div class="flex gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                            <textarea 
                                id="message-input" 
                                rows="1"
                                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                                class="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
                            ></textarea>
                            <button id="send-message" 
                                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @vite(['resources/css/chat.css', 'resources/js/chat.js'])
</x-app-layout>
