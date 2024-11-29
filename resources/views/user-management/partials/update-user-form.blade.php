<section>
    <x-modal name="edit-user-modal-{{ $user->id }}" :show="false">
        <form method="POST" action="{{ route('user.update', $user->id) }}">
            @csrf
            @method('PUT')
            <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Update User</h2>
                <div class="mt-4">
                    <x-input-label for="edit_name_{{ $user->id }}" :value="__('Name')" />
                    <x-text-input id="edit_name_{{ $user->id }}" name="name" type="text" value="{{ old('name', $user->name) }}" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('name')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="edit_email_{{ $user->id }}" :value="__('Email')" />
                    <x-text-input id="edit_email_{{ $user->id }}" name="email" type="email" value="{{ old('email', $user->email) }}" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('email')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="edit_role_{{ $user->id }}" :value="__('Role')" />
                    <select id="edit_role_{{ $user->id }}" name="role" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring focus:ring-blue-500">
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
</section>
