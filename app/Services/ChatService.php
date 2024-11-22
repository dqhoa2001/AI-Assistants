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

    public function sendToChatGPT(array $messages, $retries = 3)
    {
        $attempt = 0;
        while ($attempt < $retries) {
            try {
                $response = Http::timeout(60)->withHeaders([
                    'Authorization' => 'Bearer ' . config('services.openai.api_key'),
                    'Content-Type' => 'application/json',
                ])->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini-2024-07-18',
                    'messages' => $messages,
                ]);
                
                if ($response->successful()) {
                    return $response;
                }
                
                $attempt++;
                if ($attempt < $retries) {
                    sleep(1); // Wait 1 second before retrying
                }
                
            } catch (\Exception $e) {
                \Log::error('ChatGPT API attempt ' . ($attempt + 1) . ' failed: ' . $e->getMessage());
                $attempt++;
                if ($attempt < $retries) {
                    sleep(1);
                } else {
                    throw $e;
                }
            }
        }
        
        throw new \Exception('Failed to get response after ' . $retries . ' attempts');
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