// src/hooks/use-project.ts
'use client'

import { useAppSelector, useAppDispatch } from '@/redux/store'
import {
  addProject,
  removeProject,
  updateProject,
  createProjectStart,
  createProjectSuccess,
  createProjectFailure,
} from '@/redux/slice/projects'
import { toast } from 'sonner'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// Simple gradient generator
const generateGradientThumbnail = () => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ]

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)]
  const svgContent = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#667eea'}" />
          <stop offset="100%" style="stop-color:${randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#764ba2'}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="150" cy="100" r="30" fill="white" opacity="0.8" />
      <path d="M140 90 L160 90 L160 110 L140 110 Z" fill="white" opacity="0.6" />
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svgContent)}`
}

export const useProjectCreation = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.profile)
  const shapesState = useAppSelector((state) => state.shapes.present)
  const projectsState = useAppSelector((state) => state.projects)

  const convexCreateProject = useMutation(api.projects.createProject)
  const convexDeleteProject = useMutation(api.projects.deleteProject)
  const convexRenameProject = useMutation(api.projects.renameProject)

  const createProject = async (name?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to create projects')
      return
    }

    dispatch(createProjectStart())

    try {
      // Generate thumbnail
      const thumbnail = generateGradientThumbnail()

      // Create project directly in Convex using client-side useMutation
      const result = await convexCreateProject({
        userId: user.id as Id<'users'>,
        name: name || undefined,
        sketchesData: {
          shapes: shapesState.shapes,
          tool: shapesState.tool,
          selected: shapesState.selected,
          frameCounter: shapesState.frameCounter,
        },
        thumbnail,
      })

      // Add to Redux store immediately
      dispatch(
        addProject({
          _id: result.projectId,
          name: result.name,
          projectNumber: result.projectNumber,
          thumbnail,
          lastModified: Date.now(),
          createdAt: Date.now(),
          isPublic: false,
        })
      )

      dispatch(createProjectSuccess())
      toast.success('Project created successfully!')
    } catch (error) {
      console.error('Create project error:', error)
      dispatch(createProjectFailure('Failed to create project'))
      toast.error('Failed to create project')
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to delete projects')
      return
    }

    try {
      // Delete project using client-side useMutation to pass the auth token
      await convexDeleteProject({
        projectId: projectId as Id<'projects'>,
      })
      dispatch(removeProject(projectId))
      toast.success('Project deleted successfully!')
    } catch (error) {
      console.error('Delete project error:', error)
      toast.error('Failed to delete project')
    }
  }

  const renameProject = async (projectId: string, newName: string) => {
    if (!user?.id) {
      toast.error('Please sign in to rename projects')
      return
    }

    if (!newName.trim()) {
      toast.error('Project name cannot be empty')
      return
    }

    try {
      await convexRenameProject({
        projectId: projectId as Id<'projects'>,
        name: newName.trim(),
      })
      dispatch(updateProject({ _id: projectId, name: newName.trim() }))
      toast.success('Project renamed successfully!')
    } catch (error) {
      console.error('Rename project error:', error)
      toast.error('Failed to rename project')
    }
  }

  return {
    createProject,
    deleteProject,
    renameProject,
    isCreating: projectsState.isCreating,
    projects: projectsState.projects,
    projectsTotal: projectsState.total,
    canCreate: !!user?.id,
  }
}
