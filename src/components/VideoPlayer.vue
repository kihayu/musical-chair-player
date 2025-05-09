<template>
  <div>
    <div :id="props.playerId"></div>
    <div v-if="isApiReady && !playerError" class="controls mt-2 flex justify-center">
      <button
        @click="playVideo"
        :disabled="!buttonEnabled"
        class="mr-2 w-full rounded-xl border-4 border-black bg-green-500 px-4 py-2 font-bold text-white transition-all duration-150 hover:cursor-pointer hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-500 md:w-auto"
      >
        Resume
      </button>
    </div>
    <div v-if="playerError" class="mt-2 text-red-500">Error: {{ playerError }}</div>
    <div v-if="!isApiReady && !playerError" class="mt-2">Loading player...</div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import { useYouTubePlayer, type UseYouTubePlayerOptions } from '@/composables/useYouTubePlayer' // Adjust path if necessary

interface VideoPlayerProps {
  videoUrl: string
  playerId?: string
  width?: number | string
  height?: number | string
  autoplay?: boolean
}

const emits = defineEmits<{ (e: 'videoEnded'): void }>()

const props = withDefaults(defineProps<VideoPlayerProps>(), {
  playerId: 'youtube-player',
  width: '640',
  height: '360',
  autoplay: false,
})

const pauseTimerId = ref<number | null>(null)
const options: UseYouTubePlayerOptions = {
  playerId: props.playerId,
  videoUrl: props.videoUrl,
  width: props.width,
  height: props.height,
  autoplay: props.autoplay,
  onVideoEnded: () => {
    if (pauseTimerId.value !== null) {
      clearTimeout(pauseTimerId.value)
      pauseTimerId.value = null
    }
    emits('videoEnded')
  },
  onVideoStarted: () => {
    startTimer()
  },
  onVideoPaused: () => {
    resetTimer()
  },
}

const buttonEnabled = ref(true)
const {
  isApiReady,
  play: playVideo,
  pause: pauseVideo,
  error: playerError,
  initializePlayer: playerInitialize,
} = useYouTubePlayer(options)

const startTimer = () => {
  buttonEnabled.value = false
  const minTimer = 3 * 1000
  const maxTimer = 25 * 1000

  if (pauseTimerId.value !== null) {
    clearTimeout(pauseTimerId.value)
    pauseTimerId.value = null
  }

  const timerValue = Math.floor(Math.random() * (maxTimer - minTimer + 1)) + minTimer
  playVideo()

  pauseTimerId.value = window.setTimeout(() => {
    pauseVideo()
    pauseTimerId.value = null
    buttonEnabled.value = true
  }, timerValue)
}

const resetTimer = () => {
  if (pauseTimerId.value !== null) {
    pauseVideo()
    clearTimeout(pauseTimerId.value)
    buttonEnabled.value = true
    pauseTimerId.value = null
  }
}

watch(
  () => props,
  (newProps) => {
    resetTimer()

    if (!isApiReady.value) {
      return
    }

    options.width = newProps.width
    options.height = newProps.height
    options.videoUrl = newProps.videoUrl
    options.autoplay = newProps.autoplay
    playerInitialize(options)
    if (newProps.autoplay) {
      startTimer()
    }
  },
  { immediate: true, deep: true },
)
</script>
