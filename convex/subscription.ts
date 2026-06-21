// convex/subscription.ts
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

// Always return true to unlock S2C Premium features
export const getSubscriptionForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return {
      userId,
      polarCustomerId: 'mock-customer',
      polarSubscriptionId: 'mock-sub',
      status: 'active',
      creditsBalance: 9999,
      creditsGrantPerPeriod: 9999,
      creditsRolloverLimit: 9999,
    }
  },
})

export const hasEntitlement = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return true
  },
})

// Return a high balance so client components or logs are satisfied
export const getCreditsBalance = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return 9999
  },
})

export const getByPolarId = query({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, { polarSubscriptionId }) => {
    return null
  },
})

export const getAllForUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return []
  },
})

// Stub subscription upserts to be no-ops
export const upsertFromPolar = mutation({
  args: {
    userId: v.id('users'),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    productId: v.optional(v.string()),
    priceId: v.optional(v.string()),
    planCode: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    seats: v.optional(v.number()),
    metadata: v.optional(v.any()),
    creditsGrantPerPeriod: v.optional(v.number()),
    creditsRolloverLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return 'mock-subscription-id' as any
  },
})

// Stub credit grants to be no-ops
export const grantCreditsIfNeeded = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    idempotencyKey: v.string(),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { subscriptionId, idempotencyKey, amount, reason }) => {
    return { ok: true, skipped: true, reason: 'disabled' }
  },
})

// Stub credit consumption to always return success without deducting anything
export const consumeCredits = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    reason: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, reason, idempotencyKey }) => {
    return { ok: true, balance: 9999 }
  },
})
