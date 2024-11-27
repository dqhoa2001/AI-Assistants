<?php

namespace App\Services;

use App\Services\ChatService;
use App\Services\GeminiService;

class AIResponseService
{
    protected $chatService;
    protected $geminiService;

    public function __construct(ChatService $chatService, GeminiService $geminiService)
    {
        $this->chatService = $chatService;
        $this->geminiService = $geminiService;
    }

    public function getResponse(string $model, array $data)
    {
        switch ($model) {
            case 'gpt':
                $response = $this->chatService->generateContent($data);
                return $response->json('choices.0.message.content') ?? 'No response content';
            case 'gemini':
                $response = $this->geminiService->generateContent($data);
                return $response['candidates'][0]['content']['parts'][0]['text'] ?? 'No response content';
            case 'claude':
                // Nếu bạn có thêm xử lý cho Claude, thêm vào đây
                break;
            default:
                return 'Invalid model selected';
        }
    }
} 