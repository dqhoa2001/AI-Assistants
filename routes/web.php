<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\QAController;
use App\Http\Controllers\IntegraFlowController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Chat
    Route::get('/chat', [ChatController::class, 'index'])->name('chat');
    Route::post('/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::post('/chat/clear', [ChatController::class, 'clearHistory'])->name('chat.clear');

    // Q&A Assistant
    Route::get('/qa', [QAController::class, 'index'])->name('qa');
    Route::post('/qa/import', [QAController::class, 'importSheet'])->name('qa.import');
    Route::post('/qa/ask', [QAController::class, 'ask'])->name('qa.ask');
    Route::get('/qa/sheets', [QAController::class, 'listSheets'])->name('qa.sheets');
    Route::post('/qa/preview', [QAController::class, 'previewSheet'])->name('qa.preview');
    Route::post('/qa/check-existing', [QAController::class, 'checkExistingSheets'])->name('qa.check-existing');
    Route::post('/qa/update-sheet', [QAController::class, 'updateSheet'])->name('qa.update-sheet');
    Route::get('/qa/sheets/{id}', [QAController::class, 'getSheet'])->name('qa.sheet');
    Route::post('/qa/chat', [QAController::class, 'chat'])->name('qa.chat');
    Route::delete('/qa/sheets/{id}', [QAController::class, 'deleteSheet'])->name('qa.sheets.delete');

    // IntegraFlow
    Route::get('/integraflow', [IntegraFlowController::class, 'index'])->name('integraflow');
    Route::post('/integraflow/analyze', [IntegraFlowController::class, 'analyze'])->name('integraflow.analyze');
    Route::get('/integraflow/projects/{project}', [IntegraFlowController::class, 'show'])->name('integraflow.show');
    Route::post('/integraflow/update/{project}', [IntegraFlowController::class, 'update'])->name('integraflow.update');
    Route::delete('/integraflow/projects/{project}', [IntegraFlowController::class, 'destroy'])
        ->name('integraflow.destroy');
});

require __DIR__.'/auth.php';
