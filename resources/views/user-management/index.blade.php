<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {{ __('User Management') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 dark:text-gray-100">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium">Danh sách người dùng</h3>
                        <x-primary-button
                            x-data=""
                            x-on:click.prevent="$dispatch('open-modal', 'create-user-modal')"
                        >{{ __('Add User') }}</x-primary-button>
                    </div>
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            @foreach ($users as $user)
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">{{ $user->name }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">{{ $user->email }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">{{ $user->role }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <x-secondary-button
                                            x-data=""
                                            x-on:click.prevent="$dispatch('open-modal', 'edit-user-modal-{{ $user->id }}')"
                                        >{{ __('Edit') }}</x-secondary-button>
                                        <x-danger-button
                                            x-data=""
                                            x-on:click.prevent="$dispatch('open-modal', 'confirm-user-deletion-{{ $user->id }}')"
                                        >{{ __('Delete') }}</x-danger-button>
                                    </td>
                                </tr>

                                <!-- Modal cho chỉnh sửa người dùng -->
                                <x-modal name="edit-user-modal-{{ $user->id }}" :show="false">
                                    <form method="POST" action="{{ route('user.update', $user->id) }}">
                                        @csrf
                                        @method('PUT')
                                        <div class="p-6 bg-white rounded-lg shadow-lg">
                                            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Chỉnh sửa người dùng</h2>
                                            <div class="mt-4">
                                                <x-input-label for="edit_name_{{ $user->id }}" :value="__('Name')" />
                                                <x-text-input id="edit_name_{{ $user->id }}" name="name" type="text" value="{{ old('name', $user->name) }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                                                <x-input-error :messages="$errors->get('name')" class="mt-2" />
                                            </div>
                                            <div class="mt-4">
                                                <x-input-label for="edit_email_{{ $user->id }}" :value="__('Email')" />
                                                <x-text-input id="edit_email_{{ $user->id }}" name="email" type="email" value="{{ old('email', $user->email) }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                                                <x-input-error :messages="$errors->get('email')" class="mt-2" />
                                            </div>
                                            <div class="mt-4">
                                                <x-input-label for="edit_role_{{ $user->id }}" :value="__('Role')" />
                                                <select id="edit_role_{{ $user->id }}" name="role" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500">
                                                    <option value="user" {{ $user->role === 'user' ? 'selected' : '' }}>User</option>
                                                    <option value="admin" {{ $user->role === 'admin' ? 'selected' : '' }}>Admin</option>
                                                </select>
                                                <x-input-error :messages="$errors->get('role')" class="mt-2" />
                                            </div>
                                            <div class="mt-4">
                                                <x-input-label for="edit_is_active_{{ $user->id }}" :value="__('Is Active')" />
                                                <input type="hidden" name="is_active" value="0">
                                                <input type="checkbox" id="edit_is_active_{{ $user->id }}" name="is_active" value="1" {{ $user->is_active ? 'checked' : '' }} class="mt-1" />
                                                <x-input-error :messages="$errors->get('is_active')" class="mt-2" />
                                            </div>
                                            <div class="mt-6 flex justify-end">
                                                <x-primary-button>{{ __('Update User') }}</x-primary-button>
                                            </div>
                                        </div>
                                    </form>
                                </x-modal>

                                <!-- Modal xác nhận xóa người dng -->
                                <x-modal name="confirm-user-deletion-{{ $user->id }}" :show="false">
                                    <form method="POST" action="{{ route('user.destroy', $user->id) }}">
                                        @csrf
                                        @method('DELETE')
                                        <div class="p-6 bg-white rounded-lg shadow-lg">
                                            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {{ __('Are you sure you want to delete this user?') }}
                                            </h2>
                                            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {{ __('Once deleted, this user will be permanently removed from the system.') }}
                                            </p>
                                            <div class="mt-6 flex justify-end">
                                                <x-secondary-button x-on:click="$dispatch('close')" class="mr-2 border border-gray-300 text-gray-700 hover:bg-gray-100">
                                                    {{ __('Cancel') }}
                                                </x-secondary-button>
                                                <x-danger-button class="bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md transition duration-200">
                                                    {{ __('Delete User') }}
                                                </x-danger-button>
                                            </div>
                                        </div>
                                    </form>
                                </x-modal>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal cho tạo người dùng -->
    <x-modal name="create-user-modal" :show="false">
        <form method="POST" action="{{ route('user.store') }}">
            @csrf
            <div class="p-6 bg-white rounded-lg shadow-lg">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Thêm người dùng</h2>
                <div class="mt-4">
                    <x-input-label for="create_name" :value="__('Name')" />
                    <x-text-input id="create_name" name="name" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('name')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_email" :value="__('Email')" />
                    <x-text-input id="create_email" name="email" type="email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('email')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_password" :value="__('Password')" />
                    <x-text-input id="create_password" name="password" type="password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('password')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_password_confirmation" :value="__('Confirm Password')" />
                    <x-text-input id="create_password_confirmation" name="password_confirmation" type="password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_role" :value="__('Role')" />
                    <select id="create_role" name="role" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <x-input-error :messages="$errors->get('role')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_is_active" :value="__('Is Active')" />
                    <input type="hidden" name="is_active" value="0">
                    <input type="checkbox" id="create_is_active" name="is_active" value="1" checked class="mt-1" />
                    <x-input-error :messages="$errors->get('is_active')" class="mt-2" />
                </div>
                <div class="mt-6 flex justify-end">
                    <x-primary-button>{{ __('Create User') }}</x-primary-button>
                </div>
            </div>
        </form>
    </x-modal>
</x-app-layout>