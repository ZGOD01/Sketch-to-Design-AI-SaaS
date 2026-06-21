'use client'
import { Hash, LayoutTemplate, User, Loader2, LogOut } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useAppSelector } from '@/redux/store'
import { useAuth } from '@/hooks/use-auth'
import { CreateProject } from '../buttons/project'
import { Autosave } from '../canvas/autosave'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TabProps = {
  label: string
  href: string
  icon?: React.ReactNode
}

/** Derives up-to-2 uppercase initials from a display name or email. */
const getInitials = (displayName: string, email: string): string => {
  if (displayName && displayName !== 'User') {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  // fall back to first two chars of the email prefix
  const prefix = email.split('@')[0]
  return prefix.slice(0, 2).toUpperCase()
}

export const Navbar = () => {
  const params = useSearchParams()
  const projectId = params.get('project')
  const { handleSignOut } = useAuth()

  // Fetch real-time user data from Convex
  const user = useQuery(api.user.getCurrentUser)
  const me = useAppSelector((state) => state.profile)

  // Human-readable display name (never "untitled")
  const rawDisplayName =
    user?.name
    || me?.displayName
    || me?.name
    || ''

  const profileDisplayName = (() => {
    if (!rawDisplayName) {
      const email = user?.email || me?.email || ''
      if (email) {
        const prefix = email.split('@')[0]
        return prefix
          .split(/[._-]/)
          .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ')
      }
      return 'User'
    }
    // If it looks like a slug (no spaces, all lowercase), try to prettify it
    if (!rawDisplayName.includes(' ') && rawDisplayName === rawDisplayName.toLowerCase()) {
      return rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1)
    }
    return rawDisplayName
  })()

  // URL slug (used in routing only)
  const profileSlug = me?.name || user?.name || 'dashboard'

  const profileImage = user?.image || me?.image || ''
  const profileEmail = user?.email || me?.email || ''
  const initials = getInitials(profileDisplayName, profileEmail)

  const tabs: TabProps[] = [
    {
      label: 'Canvas',
      href: `/dashboard/${profileSlug}/canvas?project=${projectId}`,
      icon: <Hash className="h-4 w-4" />,
    },
    {
      label: 'Style Guide',
      href: `/dashboard/${profileSlug}/style-guide?project=${projectId}`,
      icon: <LayoutTemplate className="h-4 w-4" />,
    },
  ]

  const pathname = usePathname()
  const project = useQuery(
    api.projects.getProjectInfo,
    projectId && projectId !== "null" ? { projectId: projectId as Id<'projects'> } : 'skip'
  )

  const hasCanvas = pathname.includes('canvas')
  const hasStyleGuide = pathname.includes('style-guide')

  // Show a minimal loading bar while profile is still loading
  if (user === undefined && !me) {
    return (
      <div className="grid grid-cols-3 p-6 fixed top-0 left-0 right-0 z-50">
        <div />
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
        <div />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 px-5 py-4 fixed top-0 left-0 right-0 z-50">
      {/* ── LEFT: Logo + breadcrumb ── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${profileSlug}`}
          className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white" />
        </Link>
        {!hasCanvas &&
          !hasStyleGuide && (
            <span className="hidden lg:inline-block text-xs text-white/40 font-medium tracking-wide">
              Dashboard
            </span>
          )}
        {(hasCanvas || hasStyleGuide) && project?.name && (
          <div className="lg:inline-block hidden rounded-full text-white/60 border border-white/10 backdrop-blur-xl bg-white/[0.06] px-3 py-1.5 text-xs">
            {project.name}
          </div>
        )}
      </div>

      {/* ── CENTER: Tab navigation ── */}
      <div className="lg:flex hidden items-center justify-center gap-2">
        <div className="flex items-center gap-1 backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] rounded-full p-1.5 shadow-lg">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={[
                'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-150',
                `${pathname}?project=${projectId}` === t.href
                  ? 'bg-white/[0.12] text-white border border-white/[0.18] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent',
              ].join(' ')}
            >
              <span
                className={
                  `${pathname}?project=${projectId}` === t.href
                    ? 'opacity-100'
                    : 'opacity-60 group-hover:opacity-90'
                }
              >
                {t.icon}
              </span>
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Actions + profile ── */}
      <div className="flex items-center gap-3 justify-end">
        {hasCanvas && <Autosave />}
        {!hasCanvas && !hasStyleGuide && <CreateProject />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-10 cursor-pointer border border-white/10 hover:border-white/25 hover:ring-2 hover:ring-white/10 transition-all duration-200 shrink-0">
              <AvatarImage src={profileImage} alt={profileDisplayName} />
              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-semibold">
                {initials || <User className="size-4 text-white/70" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 mt-3" align="end" sideOffset={8}>
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 border border-white/10 shrink-0">
                  <AvatarImage src={profileImage} alt={profileDisplayName} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xs font-semibold">
                    {initials || <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {profileDisplayName}
                  </p>
                  <p className="text-xs leading-tight text-muted-foreground truncate mt-0.5">
                    {profileEmail}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
