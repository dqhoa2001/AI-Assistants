<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SheetContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sheet_name',
        'sheet_url',
        'headers',
        'content',
        'columns_count',
        'rows_count'
    ];

    protected $casts = [
        'headers' => 'array',
        'content' => 'array'
    ];

    public function chats()
    {
        return $this->hasMany(SheetChat::class, 'sheet_content_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 