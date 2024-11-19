<?php

namespace App\Services;

use App\Models\Chat;
use Illuminate\Support\Facades\Http;

class ChatService
{
    public function getHistory(int $userId)
    {
        return Chat::where('user_id', $userId)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function sendToChatGPT(array $messages)
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.openai.api_key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
        ]);
    }

    public function createMessage(int $userId, string $content, string $role)
    {
        return Chat::create([
            'user_id' => $userId,
            'content' => $content,
            'role' => $role
        ]);
    }
} 