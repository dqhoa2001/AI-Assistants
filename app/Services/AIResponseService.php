<?php

namespace App\Services;

use App\Services\ChatService;
use App\Services\GeminiService;
use App\Services\ClaudeService;

class AIResponseService
{
    protected $chatService;
    protected $geminiService;
    protected $claudeService;

    public function __construct(ChatService $chatService, GeminiService $geminiService, ClaudeService $claudeService)
    {
        $this->chatService = $chatService;
        $this->geminiService = $geminiService;
        $this->claudeService = $claudeService;
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
                $response = $this->claudeService->generateContent($data);
                return $response['content'][0]['text'] ?? 'No response content';
            default:
                return 'Invalid model selected';
        }
    }
} 