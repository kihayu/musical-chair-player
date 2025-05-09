<template>
  <div class="flex flex-col">
    <div class="flex w-full flex-col gap-6 md:flex-row">
      <input
        v-model="r$.$value.songUrl"
        type="url"
        class="border-black-300 w-full rounded-xl border-4 bg-white px-4 py-2"
        placeholder="Paste YouTube URL here..."
        @keydown.enter="onSubmit"
      />
      <button
        @click="onSubmit"
        class="rounded-xl border-4 bg-amber-400 px-4 py-2 text-lg font-bold transition-all duration-150 hover:cursor-pointer hover:bg-amber-500"
      >
        Add&nbsp;Song
      </button>
    </div>
    <ul v-if="showInputErrors">
      <li
        class="mt-2 rounded-xl border-4 border-black bg-red-500 px-4 py-2 font-bold"
        v-for="error in r$.$errors.songUrl"
        :key="error"
      >
        {{ error }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core'
import { withMessage } from '@regle/rules'
import { ref } from 'vue'

const showInputErrors = ref(false)
const { r$ } = useRegle(
  { songUrl: '' },
  {
    songUrl: {
      mustBeValid: withMessage((value: string | null | undefined) => {
        if (!value?.trim()) {
          return false
        }
        return !!value.match(
          /https(?:\:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)(?:&.*)?|https(?:\:\/\/)?youtu\.be\/([\w-]+)/,
        )
      }, 'URL must be a valid YouTube URL'),
    },
  },
)

interface SongInputEmits {
  (e: 'addSong', url: string): void
}
const emit = defineEmits<SongInputEmits>()
const onSubmit = async () => {
  const validationResult = await r$.$validate()
  if (!validationResult.valid) {
    showInputErrors.value = true
    return
  }

  showInputErrors.value = false
  emit('addSong', r$.$value.songUrl)
  r$.$value.songUrl = ''
}
</script>
