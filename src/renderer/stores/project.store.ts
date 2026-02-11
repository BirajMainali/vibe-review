import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: number
  name: string
  path: string
  last_opened_at: string | null
  created_at: string
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)

  const sortedProjects = computed(() => {
    return [...projects.value].sort((a, b) => {
      const aTime = a.last_opened_at || a.created_at
      const bTime = b.last_opened_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  })

  async function fetchProjects() {
    loading.value = true
    try {
      projects.value = await window.api.projects.all()
    } finally {
      loading.value = false
    }
  }

  async function addProject() {
    const dirPath = await window.api.dialog.openDirectory()
    if (!dirPath) return null

    const isRepo = await window.api.git.isRepo(dirPath)
    if (!isRepo) {
      throw new Error('Selected folder is not a git repository')
    }

    const name = dirPath.split('/').pop() || dirPath.split('\\').pop() || dirPath
    const project = await window.api.projects.add(name, dirPath)
    projects.value.push(project)
    return project
  }

  async function removeProject(id: number) {
    await window.api.projects.remove(id)
    projects.value = projects.value.filter((p) => p.id !== id)
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
  }

  async function selectProject(project: Project) {
    currentProject.value = project
    await window.api.projects.touch(project.id)
  }

  return {
    projects,
    currentProject,
    loading,
    sortedProjects,
    fetchProjects,
    addProject,
    removeProject,
    selectProject
  }
})
