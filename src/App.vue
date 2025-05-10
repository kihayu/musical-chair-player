<template>
  <main class="h-screen bg-blue-100 p-8 font-normal">
    <div class="mx-auto max-w-[1280px]">
      <SongInput @add-song="playlist.push($event)" />
      <template v-if="playlist.length > 0">
        <VideoPlayer
          class="mt-8"
          :video-url="currentVideoUrl"
          :width="playerWidth"
          :height="playerHeight"
          :autoplay="videoPlayerAutoplay"
          @video-ended="onVideoEnded"
        />
        <ul class="mt-8 rounded-xl border-4 border-black bg-white">
          <li class="border-b-4 px-4 py-2 text-xl font-bold">Playlist</li>
          <li
            class="border-b-2 px-4 py-2 last:border-b-0"
            v-for="(song, index) in playlist"
            :key="song"
            @click="onListItemClick(index)"
          >
            {{ song }}
          </li>
        </ul>
      </template>
      <div
        v-else
        class="mt-8 rounded-xl border-4 border-black bg-neutral-300 inset-shadow-sm"
        :style="{ width: playerWidth + 'px', height: playerHeight + 'px' }"
      ></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import SongInput from './components/SongInput.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const playlist = ref<Array<string>>([])
const currentMusicIndex = ref(0)
const playerWidth = ref(0)
const playerHeight = ref(0)

const maxWidth = 1280

const currentVideoUrl = computed(() => playlist.value[currentMusicIndex.value])
const videoPlayerAutoplay = ref(false)

const onVideoEnded = () => {
  videoPlayerAutoplay.value = true
  currentMusicIndex.value++
}

const onListItemClick = (index: number) => {
  currentMusicIndex.value = index

  if (index === 0) {
    videoPlayerAutoplay.value = false
  }
}

const onResize = () => {
  const availableWidth = window.innerWidth - 64
  playerWidth.value = Math.min(maxWidth, availableWidth)

  const aspectRatioMaxHeight = Math.floor((playerWidth.value * 9) / 16)
  playerHeight.value = Math.min(aspectRatioMaxHeight, window.innerHeight)
}

onMounted(() => {
  const initialAvailableWidth = window.innerWidth - 64
  playerWidth.value = Math.min(maxWidth, initialAvailableWidth)

  const initialAspectRatioMaxHeight = Math.floor((playerWidth.value * 9) / 16)
  playerHeight.value = Math.min(initialAspectRatioMaxHeight, window.innerHeight)

  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>
