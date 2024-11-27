<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use App\Services\AIResponseService;
use App\Models\Project;

class IntegraFlowController extends Controller
{
    protected $aiResponseService;

    public function __construct(AIResponseService $aiResponseService)
    {
        $this->aiResponseService = $aiResponseService;
    }

    public function index(): View
    {
        $projects = Project::where('user_id', auth()->id())
                          ->orderBy('created_at', 'desc')
                          ->get();
                          
        return view('integraflow.index', compact('projects'));
    }

    public function analyze(Request $request): JsonResponse
    {
        // Tăng timeout PHP
        ini_set('max_execution_time', 120); // 2 minutes
        $model = $request->input('model', 'gpt');
        $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'model' => 'required|string|in:gpt,gemini,claude'
        ]);

        try {
            $prompt = $this->buildAnalysisPrompt($request->name, $request->description);
            
            $messages = [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ];
            $data = [
                'messages' => $messages,
                'system' => 'You are a professional project analyst specializing in software development, project management, and business analysis.'
            ];

            $content = $this->aiResponseService->getResponse($model, $data);

            $project = Project::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'description' => $request->description,
                'analysis_result' => $content
            ]);

            return response()->json([
                'success' => true,
                'analysis' => $this->parseAnalysis($content),
                'project_id' => $project->id
            ]);

        } catch (\Exception $e) {
            \Log::error('Analysis failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        try {
            $request->validate([
                'name' => 'sometimes|required|string',
                'description' => 'sometimes|required|string',
                'content' => 'sometimes|required|string'
            ]);

            $updateData = [];
            
            if ($request->has('content')) {
                $updateData['analysis_result'] = $request->content;
            }
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('description')) {
                $updateData['description'] = $request->description;
            }

            $project->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Project updated successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Update failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Project $project): JsonResponse
    {
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        try {
            return response()->json([
                'success' => true,
                'project_id' => $project->id,
                'project' => [
                    'name' => $project->name,
                    'description' => $project->description
                ],
                'analysis' => [
                    'raw_content' => $project->analysis_result
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to load project: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to load project'
            ], 500);
        }
    }

    public function destroy(Project $project): JsonResponse
    {
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        try {
            $project->delete();
            return response()->json([
                'success' => true,
                'message' => 'Project deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Delete failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function buildAnalysisPrompt(string $name, string $description): string
    {
        return "Hãy phân tích dự án sau và cung cấp thông tin chi tiết bằng tiếng Việt, sử dụng định dạng markdown:\n\n" .
               "Tên dự án: **{$name}**\n" .
               "Mô tả dự án: *{$description}*\n\n" .
               "Vui lòng cung cấp phân tích chi tiết cho từng phần sau:\n\n" .
               "1. Đánh giá độ khó dự án\n" .
               "   - Mức độ phức tạp kỹ thuật\n" .
               "   - Thách thức chính\n" .
               "   - Yếu tố rủi ro\n\n" .
               "2. Kế hoạch thực hiện & Lịch trình\n" .
               "   - Các giai đoạn chính\n" .
               "   - Mốc thời gian quan trọng\n" .
               "   - Thời gian dự kiến\n\n" .
               "3. Công cụ AI có thể áp dụng\n" .
               "   - Danh sách công cụ\n" .
               "   - Lợi ích mang lại\n" .
               "   - Chi phí ước tính\n\n" .
               "4. Cơ cấu tổ chức nhóm\n" .
               "   - Sơ đồ tổ chức\n" .
               "   - Vai trò và trách nhiệm\n\n" .
               "5. Kỹ năng & Kinh nghiệm yêu cầu\n" .
               "   - Yêu cầu cho từng vị trí\n" .
               "   - Kinh nghiệm cần thiết\n\n" .
               "6. Quy trình đảm bảo chất lượng\n" .
               "   - Các bước kiểm thử\n" .
               "   - Tiêu chí đánh giá\n\n" .
               "7. Phân tích mô hình phát triển\n" .
               "   - So sánh Waterfall và Agile\n" .
               "   - Đề xuất mô hình phù hợp\n\n" .
               "8. Kế hoạch truyền thông\n" .
               "   - Quy trình báo cáo\n" .
               "   - Kênh liên lạc\n\n" .
               "9. Đề xuất thiết kế UI/UX\n" .
               "   - Mockup các màn hình chính\n" .
               "   - Trải nghiệm người dùng\n\n" .
               "10. Luồng điều hướng\n" .
               "    - Sơ đồ luồng màn hình\n" .
               "    - Tương tác người dùng\n\n" .
               "11. Ma trận phân quyền người dùng\n" .
               "    - Các nhóm người dùng\n" .
               "    - Quyền hạn chi tiết\n\n" .
               "12. Thiết kế cơ sở dữ liệu\n" .
               "    - Cấu trúc bảng\n" .
               "    - Quan hệ dữ liệu\n\n" .
               "13. Kiến trúc AWS\n" .
               "    - Các dịch vụ sử dụng\n" .
               "    - Sơ đồ hệ thống\n\n" .
               "14. Chiến lược chuyển đổi hệ thống\n" .
               "    - Quy trình triển khai\n" .
               "    - Kế hoạch backup\n\n" .
               "15. Ước tính giờ công\n" .
               "    - Chi tiết theo giai đoạn\n" .
               "    - Phân bổ nhân lực\n\n" .
               "16. Chi phí tại Nhật\n" .
               "    - Bảng chi phí chi tiết\n" .
               "    - Các khoản phụ phí\n\n" .
               "17. Chi phí tại Việt Nam\n" .
               "    - Bảng chi phí chi tiết\n" .
               "    - So sánh với Nhật\n\n" .
               "18. Đánh giá rủi ro\n" .
               "    - Danh sách rủi ro\n" .
               "    - Giải pháp phòng ngừa\n\n" .
               "19. Chi phí vận hành\n" .
               "    - Chi phí hàng tháng\n" .
               "    - Chi phí bảo trì\n\n" .
               "20. Phân tích thị trường Việt Nam\n" .
               "    - Tiềm năng thị trường\n" .
               "    - Đối thủ cạnh tranh\n" .
               "    - Chiến lược tiếp cận\n\n" .
               "Hãy sử dụng:\n" .
               "- **in đậm** cho điểm quan trọng\n" .
               "- *in nghiêng* cho nhấn mạnh\n" .
               "- Dấu gạch đầu dòng cho danh sách\n" .
               "- Bảng cho dữ liệu có cấu trúc\n" .
               "- > cho ghi chú quan trọng\n" .
               "- ```code``` cho chi tiết kỹ thuật\n\n" .
               "Hãy trả lời bằng tiếng Việt, chi tiết và chuyên nghiệp.";
    }

    private function parseAnalysis(string $content): array
    {
        return [
            'raw_content' => $content,
        ];
    }
    public function getProjects(): JsonResponse
    {
        $projects = Project::where('user_id', auth()->id())
                        ->orderBy('created_at', 'desc')
                        ->get();

        return response()->json(['success' => true, 'projects' => $projects]);
    }
}
