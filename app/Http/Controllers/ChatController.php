<?php

namespace App\Http\Controllers;
use App\Services\AIResponseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use App\Models\Chat;

class ChatController extends Controller
{
    protected $aiResponseService;

    public function __construct(AIResponseService $aiResponseService)
    {
        $this->aiResponseService = $aiResponseService;
    }

    public function index(): View
    {
        $chatHistory = Chat::getHistory(auth()->id());
        return view('chat.chat', compact('chatHistory'));
    }
    public function sendMessage(Request $request): JsonResponse
    {
        $userMessage = html_entity_decode($request->input('message'));
        $model = $request->input('model', 'gpt');
        // Save user message
        Chat::createMessage(auth()->id(), $userMessage, 'user');

        // Get conversation history
        $recentMessages = Chat::recentMessages(auth()->id())
            ->map(fn($chat) => [
                'role' => $chat->role,
                'content' => $chat->content
            ])
            ->toArray();

        $data = [
            'messages' => $recentMessages,
            'system' => 'You are a helpful assistant. Respond in the same language as the user\'s message.'
        ];
        // Get response from AI
        $responseMessage = $this->aiResponseService->getResponse($model, $data);

        // Save assistant response
        Chat::createMessage(auth()->id(), $responseMessage, 'assistant');

        return response()->json(['message' => $responseMessage]);
    }

    public function clearHistory(): JsonResponse
    {
        Chat::where('user_id', auth()->id())->delete();
        return response()->json(['message' => 'Chat history cleared successfully']);
    }
}
