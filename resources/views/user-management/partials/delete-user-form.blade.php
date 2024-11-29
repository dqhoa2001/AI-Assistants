<section>
    <x-modal name="confirm-user-deletion-{{ $user->id }}" :show="false">
        <form method="POST" action="{{ route('user.destroy', $user->id) }}">
            @csrf
            @method('DELETE')
            <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ __('Are you sure you want to delete this user?') }}
                </h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {{ __('Once deleted, this user will be permanently removed from the system.') }}
                </p>
                <div class="mt-6 flex justify-end">
                    <x-secondary-button x-on:click="$dispatch('close')" class="mr-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        {{ __('Cancel') }}
                    </x-secondary-button>
                    <x-danger-button class="bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md transition duration-200">
                        {{ __('Delete User') }}
                    </x-danger-button>
                </div>
            </div>
        </form>
    </x-modal>
</section>
