<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    public function generateContent(array $data, $retries = 3)
    {
        $messages = $data['messages'];
        $systemInstructionText = $data['system'];

        $contents = [];
        foreach ($messages as $message) {
            $contents[] = [
                'role' => $message['role'],
                'parts' => [
                    [
                        'text' => $message['content'],
                    ],
                ],
            ];
        }

        $payload = [
            'contents' => $contents,
            'systemInstruction' => [
                'role' => 'user',
                'parts' => [
                    [
                        'text' => $systemInstructionText,
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 1,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 8192,
                'responseMimeType' => 'text/plain',
            ],
        ];

        $attempt = 0;
        while ($attempt < $retries) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$this->apiKey}", $payload);

                if ($response->successful()) {
                    return $response->json();
                }

                throw new \Exception('Gemini API error: ' . $response->body());
            } catch (\Exception $e) {
                \Log::error('Error in GeminiService: ' . $e->getMessage());
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
