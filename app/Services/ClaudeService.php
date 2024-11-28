<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ClaudeService
{
    protected $apiKey;
    protected $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct()
    {
        $this->apiKey = config('services.claude.api_key');
    }

    public function generateContent(array $data, $retries = 3)
    {
        $messages = $data['messages'];
        $systemInstructionText = $data['system'];

        $contents = [];
        foreach ($messages as $message) {
            $contents[] = [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }
        $payload = [
            'model' => 'claude-3-5-haiku-20241022',
            'system' => $systemInstructionText,
            'messages' => $contents,
        ];
        $attempt = 0;
        while ($attempt < $retries) {
            try {
                $response = Http::withHeaders([
                    'x-api-key' => $this->apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json',
                ])->post($this->apiUrl, $payload);

                if ($response->successful()) {
                    return $response->json();
                }

                throw new \Exception('Claude API error: ' . $response->body());
            } catch (\Exception $e) {
                \Log::error('Error in ClaudeService: ' . $e->getMessage());
                $attempt++;
                if ($attempt < $retries) {
                    sleep(1); // Wait 1 second before retrying
                } else {
                    throw new \Exception('An error occurred while generating content: ' . $e->getMessage());
                }
            }
        }
    }
}
