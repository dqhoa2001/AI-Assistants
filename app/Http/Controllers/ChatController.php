<?php

namespace App\Http\Controllers;

use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use App\Models\Chat;

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function index(): View
    {
        $chatHistory = $this->chatService->getHistory(auth()->id());
        return view('chat.chat', compact('chatHistory'));
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $userMessage = html_entity_decode($request->input('message'));
        
        // Save user message
        $this->chatService->createMessage(auth()->id(), $userMessage, 'user');

        // Get conversation history
        $recentMessages = Chat::recentMessages(auth()->id())
            ->map(fn($chat) => [
                'role' => $chat->role,
                'content' => $chat->content
            ])
            ->toArray();

        // Prepare messages array
        $messages = array_merge(
            [['role' => 'system', 'content' => 'You are a helpful assistant. Respond in the same language as the user\'s message.']],
            $recentMessages
        );

        // Get response from ChatGPT
        $response = $this->chatService->sendToChatGPT($messages);
        $responseMessage = $response->json('choices.0.message.content');

        // Save assistant response
        $this->chatService->createMessage(auth()->id(), $responseMessage, 'assistant');

        return response()->json(['message' => $responseMessage]);
    }

    public function clearHistory(): JsonResponse
    {
        Chat::where('user_id', auth()->id())->delete();
        return response()->json(['message' => 'Chat history cleared successfully']);
    }
}
