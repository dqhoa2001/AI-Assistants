<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'role'
    ];

    /**
     * Get the user that owns the chat message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to get recent messages for a user.
     */
    public function scopeRecentMessages($query, $userId, $limit = 10)
    {
        return $query->where('user_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->take($limit)
                    ->get()
                    ->reverse();
    }

    public static function createMessage(int $userId, string $content, string $role)
    {
        return self::create([
            'user_id' => $userId,
            'content' => $content,
            'role' => $role
        ]);
    }

    public static function getHistory(int $userId)
    {
        return self::where('user_id', $userId)
            ->orderBy('created_at', 'asc')
            ->get();
    }
} 