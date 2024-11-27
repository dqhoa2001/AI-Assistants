<?php

namespace App\Http\Controllers;

use App\Models\SheetContent;
use App\Services\GoogleSheetService;
use App\Services\AIResponseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use App\Models\SheetChat;

class QAController extends Controller
{
    protected $aiResponseService;
    protected $sheetService;

    public function __construct(AIResponseService $aiResponseService, GoogleSheetService $sheetService)
    {
        $this->aiResponseService = $aiResponseService;
        $this->sheetService = $sheetService;
    }

    public function index(): View
    {
        $sheets = SheetContent::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return view('qa.index', compact('sheets'));
    }

    public function importSheet(Request $request): JsonResponse
    {
        $request->validate([
            'sheet_url' => 'required|url',
            'selected_sheets' => 'required|array',
            'selected_sheets.*.sheet_name' => 'required|string',
            'selected_sheets.*.headers' => 'required|array',
            'selected_sheets.*.content' => 'required|array'
        ]);

        try {
            $importedSheets = [];
            $duplicateSheets = [];
            
            foreach ($request->selected_sheets as $sheet) {
                // Kiểm tra sheet đã tồn tại chưa
                $existingSheet = SheetContent::where('user_id', auth()->id())
                    ->where('sheet_url', $request->sheet_url)
                    ->where('sheet_name', $sheet['sheet_name'])
                    ->first();

                if ($existingSheet) {
                    $duplicateSheets[] = $sheet['sheet_name'];
                    continue;
                }

                SheetContent::create([
                    'user_id' => auth()->id(),
                    'sheet_name' => $sheet['sheet_name'],
                    'sheet_url' => $request->sheet_url,
                    'headers' => $sheet['headers'],
                    'content' => $sheet['content']
                ]);
                
                $importedSheets[] = $sheet['sheet_name'];
            }

            $message = '';
            if (count($importedSheets) > 0) {
                $message .= 'Successfully imported: ' . implode(', ', $importedSheets) . '. ';
            }
            if (count($duplicateSheets) > 0) {
                $message .= 'Already exists: ' . implode(', ', $duplicateSheets);
            }

            return response()->json([
                'message' => $message,
                'imported_sheets' => $importedSheets,
                'duplicate_sheets' => $duplicateSheets
            ]);
        } catch (\Exception $e) {
            \Log::error('Sheet import error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to import sheets: ' . $e->getMessage()
            ], 500);
        }
    }

    // public function ask(Request $request): JsonResponse
    // {
    //     $request->validate([
    //         'question' => 'required|string'
    //     ]);

    //     // Get all sheet content for context
    //     $allContent = SheetContent::where('user_id', auth()->id())
    //         ->get()
    //         ->map(function($sheet) {
    //             return [
    //                 'sheet_name' => $sheet->sheet_name,
    //                 'headers' => $sheet->headers,
    //                 'content' => $sheet->content
    //             ];
    //         })
    //         ->toArray();

    //     // Prepare context for ChatGPT
    //     $messages = [
    //         ['role' => 'system', 'content' => 'You are a helpful assistant. Use the following spreadsheet data to answer questions. Only use the provided content to answer questions. If the answer cannot be found in the content, say so.'],
    //         ['role' => 'system', 'content' => 'Available data: ' . json_encode($allContent)],
    //         ['role' => 'user', 'content' => $request->question]
    //     ];

    //     $response = $this->chatService->sendToChatGPT($messages);
        
    //     return response()->json([
    //         'answer' => $response->json('choices.0.message.content')
    //     ]);
    // }

    public function listSheets(): JsonResponse
    {
        try {
            $sheets = SheetContent::where('user_id', auth()->id())
                ->orderBy('created_at', 'desc')
                ->get(['id', 'sheet_name', 'sheet_url', 'created_at', 'updated_at', 'headers', 'content'])
                ->map(function($sheet) {
                    return [
                        'id' => $sheet->id,
                        'sheet_name' => $sheet->sheet_name,
                        'sheet_url' => $sheet->sheet_url,
                        'created_at' => $sheet->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $sheet->updated_at->format('Y-m-d H:i:s'),
                        'columns_count' => count($sheet->headers ?? []),
                        'rows_count' => count($sheet->content ?? [])
                    ];
                });
                
            return response()->json(['sheets' => $sheets]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch sheets list'], 500);
        }
    }

    public function previewSheet(Request $request): JsonResponse
    {
        $request->validate([
            'sheet_url' => 'required|url'
        ]);

        try {
            $sheetData = $this->sheetService->getSheetData($request->sheet_url);
            return response()->json($sheetData);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function checkExistingSheets(Request $request): JsonResponse
    {
        $request->validate([
            'sheet_url' => 'required|url',
            'sheet_names' => 'required|array'
        ]);

        try {
            $existingSheets = SheetContent::where('user_id', auth()->id())
                ->where('sheet_url', $request->sheet_url)
                ->whereIn('sheet_name', $request->sheet_names)
                ->pluck('sheet_name')
                ->toArray();

            return response()->json([
                'existing_sheets' => $existingSheets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to check existing sheets'
            ], 500);
        }
    }

    public function updateSheet(Request $request): JsonResponse
    {
        $request->validate([
            'sheet_id' => 'required|integer',
            'sheet_url' => 'required|url'
        ]);

        try {
            $sheet = SheetContent::where('id', $request->sheet_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            $previousRows = count($sheet->content ?? []);

            // Fetch new data from Google Sheet
            $sheetData = $this->sheetService->getSheetData($request->sheet_url);
            
            // Find matching sheet from response
            $newData = collect($sheetData['sheets'])
                ->firstWhere('sheet_name', $sheet->sheet_name);

            if (!$newData) {
                return response()->json([
                    'error' => 'Sheet no longer exists in source'
                ], 404);
            }

            // Update sheet content
            $sheet->update([
                'headers' => $newData['headers'],
                'content' => $newData['content'],
                'updated_at' => now()
            ]);

            return response()->json([
                'message' => 'Sheet updated successfully',
                'previous_rows' => $previousRows,
                'current_rows' => count($newData['content'] ?? []),
                'updated_at' => now()->format('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            \Log::error('Sheet update error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update sheet: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSheet($id)
    {
        $sheet = SheetContent::with(['chats' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }])->where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();
        
        return response()->json($sheet);
    }

    public function chat(Request $request)
    {
        $model = $request->input('model', 'gpt');

        $request->validate([
            'sheet_id' => 'required|exists:sheet_contents,id',
            'message' => 'required|string',
            'model' => 'required|string|in:gpt,gemini,claude'

        ]);

        try {
            // Lưu user message
            SheetChat::create([
                'user_id' => auth()->id(),
                'sheet_content_id' => $request->sheet_id,
                'role' => 'user',
                'message' => $request->message
            ]);

            // Lấy sheet content
            $sheet = SheetContent::findOrFail($request->sheet_id);

            // Lấy 5 đoạn chat gần nhất - sử dụng method từ model
            $recentChats = SheetChat::getRecentChatsForSheet($request->sheet_id);

            // Chuẩn bị context
            $sheetContext = [
                'sheet_name' => $sheet->sheet_name,
                'headers' => $sheet->headers,
                'content' => $sheet->content
            ];

            // Tạo prompt với context và chat history
            $messages = array_merge(
                [
                    [
                        'role' => 'system', 
                        'content' => 'You are a helpful assistant. Use the following spreadsheet data to answer questions. Only use the provided content to answer questions. If the answer cannot be found in the content, say so.'
                    ],
                    [
                        'role' => 'system', 
                        'content' => 'Sheet data: ' . json_encode($sheetContext)
                    ]
                ],
                $recentChats,
            );
            $data=[
                'messages' => $recentChats,
                'system' => 'Sheet data: ' . json_encode($sheetContext)
            ];
            $responseMessage = $this->aiResponseService->getResponse($model, $data);
            // Lưu assistant response
            SheetChat::create([
                'user_id' => auth()->id(),
                'sheet_content_id' => $request->sheet_id,
                'role' => 'assistant',
                'message' => $responseMessage
            ]);
            
            return response()->json([
                'response' => $responseMessage
            ]);

        } catch (\Exception $e) {
            \Log::error('Chat error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to process chat: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteSheet($id)
    {
        try {
            $sheet = SheetContent::findOrFail($id);
            
            // Delete related chats first
            SheetChat::where('sheet_content_id', $id)->delete();
            
            // Delete the sheet
            $sheet->delete();
            
            return response()->json(['message' => 'Sheet deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete sheet'], 500);
        }
    }
} 