<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SheetChat extends Model
{
    protected $fillable = [
        'user_id',
        'sheet_content_id',
        'role',
        'message'
    ];

    public function sheet()
    {
        return $this->belongsTo(SheetContent::class, 'sheet_content_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function getRecentChatsForSheet($sheetId, $limit = 5)
    {
        return static::where('sheet_content_id', $sheetId)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->reverse()
            ->map(function($chat) {
                return [
                    'role' => $chat->role,
                    'content' => $chat->message
                ];
            })
            ->toArray();
    }
} 