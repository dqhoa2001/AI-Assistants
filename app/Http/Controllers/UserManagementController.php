<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class UserManagementController extends Controller
{
    public function index(): View
    {
        $users = User::all();
        return view('user-management.index', compact('users'));
    }

    public function create(): View
    {
        return view('user-management.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:user,admin',
            'is_active' => 'required|boolean',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => $request->role,
            'is_active' => $request->is_active,
        ]);

        return redirect()->route('user.management')->with('success', 'User created successfully.');
    }

    public function edit(User $user): View
    {
        return view('user-management.edit', compact('user'));
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|string|in:user,admin',
            'is_active' => 'required|boolean',
        ]);

        $user->update($request->only('name', 'email', 'role', 'is_active'));

        return redirect()->route('user.management')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();
        return redirect()->route('user.management')->with('success', 'User deleted successfully.');
    }
}
