import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://risphrngpdhesslhjcin.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3Bocm5ncGRoZXNzbGhqY2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzY4OTgsImV4cCI6MjA2OTg1Mjg5OH0.mD7ecOITZqH5NSNioUS8NOpz20UH8BZJnIrOj6uxcyI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})



export const createUserPresenceChannel = (userId) => {
  return supabase
    .channel(`user-presence-${userId}`)
    .on('presence', { event: 'sync' }, () => {
      console.log('Presence synced')
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences)
    })
}

export const createTypingChannel = (roomId) => {
  return supabase
    .channel(`typing-${roomId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      console.log('Typing event:', payload)
    })
} 