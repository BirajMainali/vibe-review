<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DiffFile as DiffFileType, DiffBlock } from 'diff2html'
import DiffLine from './DiffLine.vue'
import CommentCard from '@/components/review/CommentCard.vue'

const props = defineProps<{
  file: DiffFileType
  comments: any[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-comment', data: { filePath: string; startLine: number; endLine: number; side: string }): void
}>()

const collapsed = ref(false)

// Selection state
const selectionStart = ref<{ line: number; side: string } | null>(null)
const selectionEnd = ref<{ line: number; side: string } | null>(null)
const isSelecting = ref(false)

const selectedRange = computed(() => {
  if (!selectionStart.value || !selectionEnd.value) return null
  const start = Math.min(selectionStart.value.line, selectionEnd.value.line)
  const end = Math.max(selectionStart.value.line, selectionEnd.value.line)
  return { start, end, side: selectionEnd.value.side }
})

function handleLineClick(lineNumber: number, side: string, event: MouseEvent) {
  if (props.readonly) return

  if (event.shiftKey && selectionStart.value) {
    selectionEnd.value = { line: lineNumber, side }
  } else {
    selectionStart.value = { line: lineNumber, side }
    selectionEnd.value = { line: lineNumber, side }
  }
  isSelecting.value = true
}

function isLineSelected(lineNumber: number): boolean {
  if (!selectedRange.value) return false
  return lineNumber >= selectedRange.value.start && lineNumber <= selectedRange.value.end
}

function addCommentOnSelection() {
  if (!selectedRange.value) return
  emit('add-comment', {
    filePath: props.file.newName,
    startLine: selectedRange.value.start,
    endLine: selectedRange.value.end,
    side: selectedRange.value.side
  })
  clearSelection()
}

function clearSelection() {
  selectionStart.value = null
  selectionEnd.value = null
  isSelecting.value = false
}

function getCommentsForLine(lineNumber: number) {
  return props.comments.filter(
    (c) => lineNumber >= c.start_line && lineNumber <= c.end_line
  )
}

function shouldShowComment(lineNumber: number, commentId: number) {
  // Show comment after the last line of its range
  const comment = props.comments.find((c) => c.id === commentId)
  if (!comment) return false
  return lineNumber === comment.end_line
}

// Flatten blocks into lines for rendering
interface FlatLine {
  type: string
  oldNumber: number | undefined
  newNumber: number | undefined
  content: string
  blockHeader?: string
}

function flattenBlocks(blocks: DiffBlock[]): FlatLine[] {
  const lines: FlatLine[] = []
  for (const block of blocks) {
    if (block.header) {
      lines.push({ type: 'hunk', oldNumber: undefined, newNumber: undefined, content: block.header, blockHeader: block.header })
    }
    for (const line of block.lines) {
      lines.push({
        type: line.type,
        oldNumber: line.oldNumber,
        newNumber: line.newNumber,
        content: line.content
      })
    }
  }
  return lines
}
</script>

<template>
  <div class="border-b border-gray-200 dark:border-gray-700">
    <!-- File header -->
    <div
      class="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm cursor-pointer"
      @click="collapsed = !collapsed"
    >
      <div class="flex items-center gap-2 min-w-0">
        <svg
          class="w-4 h-4 text-gray-400 transition-transform flex-shrink-0"
          :class="{ '-rotate-90': collapsed }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <span class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{{ file.newName }}</span>
      </div>
      <div class="flex items-center gap-2 text-xs flex-shrink-0">
        <span class="text-green-600 dark:text-green-400">+{{ file.addedLines }}</span>
        <span class="text-red-600 dark:text-red-400">-{{ file.deletedLines }}</span>
      </div>
    </div>

    <!-- Diff lines -->
    <div v-show="!collapsed" class="relative">
      <!-- Floating add comment button -->
      <transition name="fade">
        <div
          v-if="isSelecting && selectedRange && !readonly"
          class="sticky top-10 z-20 flex justify-center py-1"
        >
          <button
            @click="addCommentOnSelection"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Add Review Comment ({{ selectedRange.start }}{{ selectedRange.start !== selectedRange.end ? '-' + selectedRange.end : '' }})
          </button>
          <button
            @click="clearSelection"
            class="ml-1 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </transition>

      <table class="w-full text-xs font-mono border-collapse">
        <tbody>
          <template v-for="(line, idx) in flattenBlocks(file.blocks)" :key="idx">
            <DiffLine
              :type="line.type"
              :old-number="line.oldNumber"
              :new-number="line.newNumber"
              :content="line.content"
              :selected="line.newNumber ? isLineSelected(line.newNumber) : false"
              @line-click="(num, side, ev) => handleLineClick(num, side, ev)"
            />
            <!-- Show inline comments -->
            <tr v-for="comment in (line.newNumber ? getCommentsForLine(line.newNumber) : [])" :key="'c-' + comment.id">
              <td v-if="shouldShowComment(line.newNumber!, comment.id)" colspan="3" class="p-0">
                <div class="mx-4 my-2">
                  <CommentCard :comment="comment" :readonly="readonly" />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
