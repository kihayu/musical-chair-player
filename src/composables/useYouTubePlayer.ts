/// <reference types="youtube" />
import { ref, onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue'

interface WindowWithYouTubeAPI extends Window {
  YT?: typeof YT
  onYouTubeIframeAPIReady?: () => void
}

let isApiScriptInjectedGlobal = false
let isApiReadyGlobal = false
const apiReadyCallbacksGlobal: Array<() => void> = []

function processApiReadyQueue() {
  isApiReadyGlobal = true
  while (apiReadyCallbacksGlobal.length > 0) {
    const callback = apiReadyCallbacksGlobal.shift()
    if (callback) {
      try {
        callback()
      } catch (e) {
        console.error('Error executing API ready callback:', e)
      }
    }
  }
}

if (typeof window !== 'undefined') {
  const ytWindow = window as WindowWithYouTubeAPI

  if (typeof ytWindow.onYouTubeIframeAPIReady === 'undefined') {
    ytWindow.onYouTubeIframeAPIReady = () => {
      if (ytWindow.YT && ytWindow.YT.Player) {
        processApiReadyQueue()
      } else {
        console.error('onYouTubeIframeAPIReady called, but YT.Player not found.')
      }
    }
  } else {
    // If it's already defined, it might be by another part of the app or another version of this logic.
    // This scenario needs careful handling in a larger app; for now, we assume this module is the primary controller,
    // or that an existing onYouTubeIframeAPIReady will eventually call processApiReadyQueue if needed.
    // A more robust solution might involve checking if YT is already available and processing the queue.
    if (ytWindow.YT && ytWindow.YT.Player && !isApiReadyGlobal) {
      // If API is already there but our global flag isn't set, means it loaded before our script ran or set its callback.
      // Process queue now if our script is just catching up.
      // This assumes the existing callback might not know about our queue.
      // This part is tricky and depends on load order.
      // For safety, if YT is there, just run our queue.
      // processApiReadyQueue(); // This could lead to double execution if the original callback also runs it.
      // Best to rely on the single callback assignment or more advanced state sharing.
    }
  }
}

export interface UseYouTubePlayerOptions {
  playerId: string
  videoUrl: string
  autoplay: boolean
  width?: number | string
  height?: number | string
  onVideoEnded?: () => void
  onVideoStarted?: () => void
  onVideoPaused?: () => void
}

export const useYouTubePlayer = (options: UseYouTubePlayerOptions) => {
  const { videoUrl } = options

  const playerInstance = ref<YT.Player | null>(null)
  const isApiReadyInstance = ref(false)
  const error = ref<string | null>(null)

  const instanceInitializer = () => {
    if (!playerInstance.value) {
      isApiReadyInstance.value = true
      initializePlayer()
    }
  }

  function getVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2] && match[2].length === 11) {
      return match[2]
    }
    error.value = 'Invalid YouTube URL or could not extract video ID.'
    console.error(error.value, url)
    return null
  }

  function initializePlayer(customOptions?: UseYouTubePlayerOptions) {
    const {
      playerId,
      videoUrl,
      width = '640',
      height = '360',
      autoplay,
      onVideoEnded,
      onVideoStarted,
      onVideoPaused,
    } = customOptions ?? options

    const currentVideoId = getVideoId(videoUrl)
    if (!currentVideoId) {
      return
    }

    if (playerInstance.value && typeof playerInstance.value.destroy === 'function') {
      playerInstance.value.destroy()
      playerInstance.value = null
    }

    nextTick(() => {
      const targetElement = document.getElementById(playerId)
      if (!targetElement) {
        error.value = `Player target element '${playerId}' not found.`
        console.error(error.value)
        return
      }

      const ytWindow = window as WindowWithYouTubeAPI
      if (ytWindow.YT && ytWindow.YT.Player) {
        try {
          playerInstance.value = new ytWindow.YT.Player(playerId, {
            height: String(height),
            width: String(width),
            videoId: currentVideoId,
            playerVars: {
              playsinline: 1,
            },
            events: {
              onReady: () => {
                error.value = null
                if (autoplay) {
                  playerInstance.value?.playVideo()
                }
              },
              onStateChange: (event: YT.OnStateChangeEvent) => {
                if (event.data === YT.PlayerState.ENDED) {
                  onVideoEnded?.()
                } else if (event.data === YT.PlayerState.PLAYING) {
                  onVideoStarted?.()
                } else if (event.data === YT.PlayerState.PAUSED) {
                  onVideoPaused?.()
                }
              },
              onError: (event: YT.OnErrorEvent) => {
                error.value = `YouTube Player Error: ${event.data}`
                console.error(error.value, event)
              },
            },
          })
        } catch (e) {
          error.value = `Failed to initialize YouTube player: ${e instanceof Error ? e.message : String(e)}`
          console.error(error.value, e)
        }
      } else {
        error.value =
          'YouTube API not available for player initialization (race condition or script load error).'
        console.error(error.value)
      }
    })
  }

  function loadYouTubeAPI() {
    const ytWindow = window as WindowWithYouTubeAPI

    if (isApiReadyGlobal && ytWindow.YT && ytWindow.YT.Player) {
      instanceInitializer()
      return
    }

    if (!apiReadyCallbacksGlobal.includes(instanceInitializer)) {
      apiReadyCallbacksGlobal.push(instanceInitializer)
    }

    if (!isApiScriptInjectedGlobal) {
      isApiScriptInjectedGlobal = true
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag)
      }
    } else if (isApiReadyGlobal) {
      // This case: script was injected, API became ready (isApiReadyGlobal=true),
      // but this instance (e.g., mounted late) missed the initial callback flush.
      // Process the queue again; it will pick up this instance's callback if it's new.
      processApiReadyQueue()
    }
    // If script is injected but API not yet ready (isApiReadyGlobal=false),
    // this instance's callback is in the queue and will be called by the global handler.
  }

  const play = () => {
    if (playerInstance.value && typeof playerInstance.value.playVideo === 'function') {
      playerInstance.value.playVideo()
    }
  }

  const pause = () => {
    if (playerInstance.value && typeof playerInstance.value.pauseVideo === 'function') {
      playerInstance.value.pauseVideo()
    }
  }

  watch(
    () => videoUrl,
    (newUrl) => {
      if (newUrl && isApiReadyInstance.value) {
        const newVideoId = getVideoId(newUrl)
        if (newVideoId) {
          if (playerInstance.value && typeof playerInstance.value.loadVideoById === 'function') {
            playerInstance.value.loadVideoById(newVideoId)
          } else {
            initializePlayer()
          }
        } else {
          if (playerInstance.value && typeof playerInstance.value.stopVideo === 'function') {
            playerInstance.value.stopVideo()
          }
        }
      }
    },
    { immediate: false },
  )

  onMounted(() => {
    loadYouTubeAPI()
  })

  onUnmounted(() => {
    if (playerInstance.value && typeof playerInstance.value.destroy === 'function') {
      playerInstance.value.destroy()
      playerInstance.value = null
    }
    const index = apiReadyCallbacksGlobal.indexOf(instanceInitializer)
    if (index > -1) {
      apiReadyCallbacksGlobal.splice(index, 1)
    }
  })

  return {
    playerInstance,
    isApiReady: isApiReadyInstance,
    play,
    pause,
    error,
    initializePlayer,
  }
}
