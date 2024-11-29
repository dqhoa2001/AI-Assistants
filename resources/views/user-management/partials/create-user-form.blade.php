<section>
    <x-modal name="create-user-modal" :show="false">
        <form method="POST" action="{{ route('user.store') }}">
            @csrf
            <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Create User</h2>
                <div class="mt-4">
                    <x-input-label for="create_name" :value="__('Name')" />
                    <x-text-input id="create_name" name="name" type="text" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('name')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_email" :value="__('Email')" />
                    <x-text-input id="create_email" name="email" type="email" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('email')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_password" :value="__('Password')" />
                    <x-text-input id="create_password" name="password" type="password" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('password')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_password_confirmation" :value="__('Confirm Password')" />
                    <x-text-input id="create_password_confirmation" name="password_confirmation" type="password" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring focus:ring-blue-500" />
                    <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
                </div>
                <div class="mt-4">
                    <x-input-label for="create_role" :value="__('Role')" />
                    <select id="create_role" name="role" required class="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring focus:ring-blue-500">
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
</section>
